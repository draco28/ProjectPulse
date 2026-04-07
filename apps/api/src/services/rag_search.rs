use std::collections::HashMap;
use std::pin::Pin;
use std::sync::Arc;

use anyhow::{Context as _, Result};
use async_trait::async_trait;
use futures::StreamExt;
use pulsehive::agent::AgentOutcome;
use pulsehive::event::HiveEvent;
use pulsehive::{HiveMind, Task};
use sqlx::PgPool;

use crate::agents::rag_retriever::rag_retriever_agent;
use crate::models::rag::{
    RagContext, RagResult, RagSource, RelatedChunk, SearchOptions,
};
use crate::services::embeddings::EmbeddingService;

/// Trait for RAG search implementations.
///
/// Sprint 4: `PgVectorRagService` (pgvector hybrid search).
/// Sprint 5: `AgenticRagService` wraps PgVectorRagService + HiveMind for complex queries.
///
/// Route handlers call `state.rag.search()` — they never know which
/// implementation is behind it.
#[async_trait]
pub trait RagService: Send + Sync {
    /// Search across all indexed content using hybrid retrieval (vector + keyword).
    async fn search(&self, query: &str, options: SearchOptions) -> Result<Vec<RagResult>>;

    /// Assemble a context document for a task, within a token budget.
    async fn get_context(&self, task: &str, project_id: i32, budget: usize)
        -> Result<RagContext>;
}

// ============================================================================
// PgVectorRagService — Real implementation using pgvector + tsvector + RRF
// ============================================================================

/// Row returned from semantic (pgvector) or keyword (tsvector) search.
#[derive(Debug, sqlx::FromRow)]
#[allow(dead_code)] // similarity is mapped by sqlx but RRF uses rank position
struct ChunkSearchRow {
    id: i32,
    content: String,
    source_type: String,
    source_id: i32,
    section_title: Option<String>,
    domain_tags: Vec<String>,
    similarity: f64, // cosine similarity or ts_rank score
}

/// Row returned from the relations JOIN.
#[derive(Debug, sqlx::FromRow)]
struct RelationRow {
    from_chunk_id: i32,
    relation_type: String,
    related_source_type: String,
    related_source_id: i32,
    related_section_title: Option<String>,
}

/// Intermediate result with RRF score before final ranking.
struct ScoredChunk {
    id: i32,
    content: String,
    source_type: String,
    source_id: i32,
    section_title: Option<String>,
    domain_tags: Vec<String>,
    rrf_score: f64,
}

/// pgvector + tsvector hybrid search with Reciprocal Rank Fusion.
pub struct PgVectorRagService {
    db: PgPool,
    embeddings: EmbeddingService,
}

impl PgVectorRagService {
    pub fn new(db: PgPool, embeddings: EmbeddingService) -> Self {
        Self { db, embeddings }
    }

    /// Semantic search via pgvector cosine similarity.
    async fn search_semantic(
        &self,
        query_embedding: &[f32],
        project_id: i32,
        limit: usize,
        source_types: &Option<Vec<String>>,
    ) -> Result<Vec<ChunkSearchRow>> {
        let embedding_str = format!(
            "[{}]",
            query_embedding.iter().map(|f| f.to_string()).collect::<Vec<_>>().join(",")
        );

        // pgvector cosine distance: 1 - (a <=> b) gives similarity
        let rows = if let Some(types) = source_types {
            sqlx::query_as::<_, ChunkSearchRow>(
                r#"
                SELECT id, content, source_type, source_id, section_title, domain_tags,
                       (1.0 - (embedding <=> $1::vector))::float8 AS similarity
                FROM rag_chunks
                WHERE project_id = $2 AND source_type = ANY($4)
                ORDER BY embedding <=> $1::vector
                LIMIT $3
                "#,
            )
            .bind(&embedding_str)
            .bind(project_id)
            .bind(limit as i64)
            .bind(types)
            .fetch_all(&self.db)
            .await?
        } else {
            sqlx::query_as::<_, ChunkSearchRow>(
                r#"
                SELECT id, content, source_type, source_id, section_title, domain_tags,
                       (1.0 - (embedding <=> $1::vector))::float8 AS similarity
                FROM rag_chunks
                WHERE project_id = $2
                ORDER BY embedding <=> $1::vector
                LIMIT $3
                "#,
            )
            .bind(&embedding_str)
            .bind(project_id)
            .bind(limit as i64)
            .fetch_all(&self.db)
            .await?
        };

        Ok(rows)
    }

    /// Keyword search via tsvector ts_rank_cd.
    async fn search_keyword(
        &self,
        query: &str,
        project_id: i32,
        limit: usize,
        source_types: &Option<Vec<String>>,
    ) -> Result<Vec<ChunkSearchRow>> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }

        let rows = if let Some(types) = source_types {
            sqlx::query_as::<_, ChunkSearchRow>(
                r#"
                SELECT id, content, source_type, source_id, section_title, domain_tags,
                       ts_rank_cd(content_tsv, plainto_tsquery('english', $1))::float8 AS similarity
                FROM rag_chunks
                WHERE project_id = $2
                  AND content_tsv @@ plainto_tsquery('english', $1)
                  AND source_type = ANY($4)
                ORDER BY similarity DESC
                LIMIT $3
                "#,
            )
            .bind(query)
            .bind(project_id)
            .bind(limit as i64)
            .bind(types)
            .fetch_all(&self.db)
            .await?
        } else {
            sqlx::query_as::<_, ChunkSearchRow>(
                r#"
                SELECT id, content, source_type, source_id, section_title, domain_tags,
                       ts_rank_cd(content_tsv, plainto_tsquery('english', $1))::float8 AS similarity
                FROM rag_chunks
                WHERE project_id = $2
                  AND content_tsv @@ plainto_tsquery('english', $1)
                ORDER BY similarity DESC
                LIMIT $3
                "#,
            )
            .bind(query)
            .bind(project_id)
            .bind(limit as i64)
            .fetch_all(&self.db)
            .await?
        };

        Ok(rows)
    }

    /// Fetch recent chunks (fallback for empty queries).
    async fn search_recent(
        &self,
        project_id: i32,
        limit: usize,
    ) -> Result<Vec<ChunkSearchRow>> {
        let rows = sqlx::query_as::<_, ChunkSearchRow>(
            r#"
            SELECT id, content, source_type, source_id, section_title, domain_tags,
                   0.5::float8 AS similarity
            FROM rag_chunks
            WHERE project_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
        )
        .bind(project_id)
        .bind(limit as i64)
        .fetch_all(&self.db)
        .await?;

        Ok(rows)
    }

    /// Merge semantic + keyword results via Reciprocal Rank Fusion.
    /// RRF score = 1/(k + rank_semantic) + 1/(k + rank_keyword), k=60
    fn merge_rrf(
        semantic: Vec<ChunkSearchRow>,
        keyword: Vec<ChunkSearchRow>,
        limit: usize,
    ) -> Vec<ScoredChunk> {
        const K: f64 = 60.0;
        let mut scores: HashMap<i32, ScoredChunk> = HashMap::new();

        // Add semantic results with RRF
        for (rank, row) in semantic.into_iter().enumerate() {
            let rrf = 1.0 / (K + rank as f64 + 1.0);
            scores.entry(row.id).or_insert_with(|| ScoredChunk {
                id: row.id,
                content: row.content,
                source_type: row.source_type,
                source_id: row.source_id,
                section_title: row.section_title,
                domain_tags: row.domain_tags,
                rrf_score: 0.0,
            }).rrf_score += rrf;
        }

        // Add keyword results with RRF
        for (rank, row) in keyword.into_iter().enumerate() {
            let rrf = 1.0 / (K + rank as f64 + 1.0);
            scores.entry(row.id).or_insert_with(|| ScoredChunk {
                id: row.id,
                content: row.content,
                source_type: row.source_type,
                source_id: row.source_id,
                section_title: row.section_title,
                domain_tags: row.domain_tags,
                rrf_score: 0.0,
            }).rrf_score += rrf;
        }

        let mut results: Vec<ScoredChunk> = scores.into_values().collect();
        results.sort_by(|a, b| b.rrf_score.partial_cmp(&a.rrf_score).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(limit);
        results
    }

    /// Fetch graph relations for a set of chunk IDs (single-hop expansion).
    async fn fetch_relations(&self, chunk_ids: &[i32]) -> Result<Vec<RelationRow>> {
        if chunk_ids.is_empty() {
            return Ok(Vec::new());
        }

        let rows = sqlx::query_as::<_, RelationRow>(
            r#"
            SELECT
                r.from_chunk_id,
                r.relation_type,
                c.source_type AS related_source_type,
                c.source_id AS related_source_id,
                c.section_title AS related_section_title
            FROM rag_relations r
            JOIN rag_chunks c ON c.id = r.to_chunk_id
            WHERE r.from_chunk_id = ANY($1)
            "#,
        )
        .bind(chunk_ids)
        .fetch_all(&self.db)
        .await
        .context("failed to fetch relations")?;

        Ok(rows)
    }
}

#[async_trait]
impl RagService for PgVectorRagService {
    async fn search(&self, query: &str, options: SearchOptions) -> Result<Vec<RagResult>> {
        let is_empty_query = query.trim().is_empty();

        let scored = if is_empty_query {
            // Empty query → return recent chunks
            let recent = self.search_recent(options.project_id, options.limit).await?;
            recent
                .into_iter()
                .enumerate()
                .map(|(i, row)| ScoredChunk {
                    id: row.id,
                    content: row.content,
                    source_type: row.source_type,
                    source_id: row.source_id,
                    section_title: row.section_title,
                    domain_tags: row.domain_tags,
                    rrf_score: 1.0 / (1.0 + i as f64), // Decaying score by recency
                })
                .collect()
        } else {
            // Generate query embedding
            let query_embedding = self.embeddings.embed(query).await?;

            // Run semantic + keyword search in parallel
            let over_fetch = (options.limit * 2).min(100);
            let (semantic, keyword) = tokio::try_join!(
                self.search_semantic(&query_embedding, options.project_id, over_fetch, &options.source_types),
                self.search_keyword(query, options.project_id, over_fetch, &options.source_types),
            )?;

            Self::merge_rrf(semantic, keyword, options.limit)
        };

        // Fetch relations if requested
        let relations = if options.include_relations {
            let chunk_ids: Vec<i32> = scored.iter().map(|s| s.id).collect();
            self.fetch_relations(&chunk_ids).await?
        } else {
            Vec::new()
        };

        // Group relations by from_chunk_id
        let mut relation_map: HashMap<i32, Vec<&RelationRow>> = HashMap::new();
        for rel in &relations {
            relation_map.entry(rel.from_chunk_id).or_default().push(rel);
        }

        // Build final results
        let results = scored
            .into_iter()
            .map(|chunk| {
                let related = relation_map
                    .get(&chunk.id)
                    .map(|rels| {
                        rels.iter()
                            .map(|r| RelatedChunk {
                                relation: r.relation_type.clone(),
                                source_type: r.related_source_type.clone(),
                                id: r.related_source_id,
                                title: r.related_section_title.clone().unwrap_or_default(),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                RagResult {
                    content: chunk.content,
                    score: chunk.rrf_score,
                    source: RagSource {
                        source_type: chunk.source_type,
                        id: chunk.source_id,
                        title: chunk.section_title.clone().unwrap_or_default(),
                        section: chunk.section_title,
                        domain_tags: chunk.domain_tags,
                    },
                    related,
                }
            })
            .collect();

        Ok(results)
    }

    async fn get_context(
        &self,
        task: &str,
        project_id: i32,
        budget: usize,
    ) -> Result<RagContext> {
        // Search for relevant chunks
        let results = self
            .search(
                task,
                SearchOptions {
                    project_id,
                    limit: 20,
                    source_types: None,
                    include_relations: false,
                },
            )
            .await?;

        // Assemble context within token budget (approximate: 4 chars/token)
        let mut context = String::new();
        let mut sources = Vec::new();
        let mut token_count = 0;

        for result in results {
            let chunk_tokens = result.content.split_whitespace().count();
            if token_count + chunk_tokens > budget {
                break;
            }

            context.push_str(&format!(
                "### {} ({})\n{}\n\n",
                result.source.title, result.source.source_type, result.content
            ));
            token_count += chunk_tokens;
            sources.push(result.source);
        }

        Ok(RagContext {
            context,
            sources,
            token_count,
        })
    }
}

// ============================================================================
// StubRagService — kept for testing without database
// ============================================================================

pub struct StubRagService;

#[async_trait]
impl RagService for StubRagService {
    async fn search(&self, _query: &str, _options: SearchOptions) -> Result<Vec<RagResult>> {
        Ok(Vec::new())
    }

    async fn get_context(
        &self,
        _task: &str,
        _project_id: i32,
        _budget: usize,
    ) -> Result<RagContext> {
        Ok(RagContext {
            context: String::new(),
            sources: Vec::new(),
            token_count: 0,
        })
    }
}

// ============================================================================
// AdaptiveRAG Query Router (Sprint 5 #261)
// ============================================================================

/// Query complexity classification for AdaptiveRAG routing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QueryComplexity {
    /// Short keyword lookup → PgVectorRagService (RRF hybrid, <50ms)
    Simple,
    /// Semantic search with some context → PgVectorRagService + graph expansion (<100ms)
    Moderate,
    /// Multi-hop reasoning, temporal, comparative → RAGRetriever agent via HiveMind (<2s)
    Complex,
}

/// Classify query complexity for AdaptiveRAG routing.
/// Heuristic-only (no LLM call, <1ms).
pub fn classify_complexity(query: &str) -> QueryComplexity {
    let words: Vec<&str> = query.split_whitespace().collect();
    let word_count = words.len();

    let has_temporal = words.iter().any(|w| {
        ["between", "changed", "history", "when", "before", "after", "since"].contains(w)
    });
    let has_comparison = words.iter().any(|w| {
        ["vs", "compare", "difference", "versus", "better", "instead"].contains(w)
    });
    let has_reasoning = words.iter().any(|w| {
        ["why", "how", "explain", "because", "reason", "cause"].contains(w)
    });
    let has_multi_entity = query.matches('#').count() >= 2;

    if word_count <= 4 && !has_temporal && !has_comparison && !has_reasoning {
        QueryComplexity::Simple
    } else if has_temporal || has_comparison || has_multi_entity || (has_reasoning && word_count > 8)
    {
        QueryComplexity::Complex
    } else {
        QueryComplexity::Moderate
    }
}

// ============================================================================
// AgenticRagService — Sprint 5 #263
// Wraps PgVectorRagService (fast) + HiveMind RAGRetriever (complex)
// ============================================================================

/// Agent-powered RAG service using AdaptiveRAG routing.
///
/// Simple/Moderate queries → PgVectorRagService (pgvector + tsvector, <100ms)
/// Complex queries → RAGRetriever agent via HiveMind (<2s)
pub struct AgenticRagService {
    simple: PgVectorRagService,
    hive: Arc<HiveMind>,
    db: PgPool,
    llm_provider: String,
    llm_model: String,
}

impl AgenticRagService {
    pub fn new(
        simple: PgVectorRagService,
        hive: Arc<HiveMind>,
        db: PgPool,
        llm_provider: String,
        llm_model: String,
    ) -> Self {
        Self {
            simple,
            hive,
            db,
            llm_provider,
            llm_model,
        }
    }

    /// Deploy RAGRetriever agent for complex multi-step search.
    async fn agent_search(&self, query: &str, options: SearchOptions) -> Result<Vec<RagResult>> {
        let agent = rag_retriever_agent(
            self.db.clone(),
            &self.llm_provider,
            &self.llm_model,
        );
        let task = Task::new(format!("Search for: {}", query));

        let mut stream: Pin<Box<dyn futures::Stream<Item = HiveEvent> + Send>> = self
            .hive
            .deploy(vec![agent], vec![task])
            .await
            .context("failed to deploy RAGRetriever agent")?;

        // Collect agent response from event stream
        let mut agent_response = String::new();
        while let Some(event) = stream.next().await {
            match event {
                HiveEvent::AgentCompleted { outcome, .. } => {
                    match outcome {
                        AgentOutcome::Complete { response } => {
                            agent_response = response;
                        }
                        AgentOutcome::Error { error } => {
                            tracing::warn!(error = %error, "RAGRetriever agent failed, falling back to simple search");
                            return self.simple.search(query, options).await;
                        }
                        AgentOutcome::MaxIterationsReached => {
                            tracing::warn!("RAGRetriever hit max iterations, falling back");
                            return self.simple.search(query, options).await;
                        }
                    }
                    break;
                }
                HiveEvent::ToolCallCompleted {
                    agent_id,
                    tool_name,
                    ..
                } => {
                    tracing::debug!(agent = %agent_id, tool = %tool_name, "agent tool call completed");
                }
                _ => {} // Skip other events
            }
        }

        // Parse agent response into RagResults
        if agent_response.is_empty() {
            tracing::warn!("RAGRetriever returned empty response, falling back");
            return self.simple.search(query, options).await;
        }

        // Try parsing as JSON array of results
        let results = parse_agent_response(&agent_response, options.limit);

        // If parsing fails or returns nothing, fall back to simple search
        if results.is_empty() {
            tracing::debug!("agent response didn't parse into results, falling back");
            return self.simple.search(query, options).await;
        }

        Ok(results)
    }
}

#[async_trait]
impl RagService for AgenticRagService {
    async fn search(&self, query: &str, options: SearchOptions) -> Result<Vec<RagResult>> {
        let complexity = classify_complexity(query);
        tracing::debug!(query = %query, complexity = ?complexity, "AdaptiveRAG routing");

        match complexity {
            QueryComplexity::Simple | QueryComplexity::Moderate => {
                self.simple.search(query, options).await
            }
            QueryComplexity::Complex => {
                self.agent_search(query, options).await
            }
        }
    }

    async fn get_context(
        &self,
        task: &str,
        project_id: i32,
        budget: usize,
    ) -> Result<RagContext> {
        // Context assembly always uses the simple path (deterministic, fast)
        self.simple.get_context(task, project_id, budget).await
    }
}

/// Parse the RAGRetriever agent's text response into RagResults.
///
/// The agent is instructed to return JSON array of objects with:
/// content, source_type, source_id, relevance_reason
fn parse_agent_response(response: &str, limit: usize) -> Vec<RagResult> {
    // Try to find JSON array in the response
    let json_start = response.find('[');
    let json_end = response.rfind(']');

    if let (Some(start), Some(end)) = (json_start, json_end) {
        if let Ok(items) = serde_json::from_str::<Vec<serde_json::Value>>(&response[start..=end]) {
            return items
                .into_iter()
                .take(limit)
                .enumerate()
                .map(|(i, item)| RagResult {
                    content: item["content"]
                        .as_str()
                        .unwrap_or("")
                        .to_string(),
                    score: 1.0 / (1.0 + i as f64), // Rank-based score
                    source: RagSource {
                        source_type: item["source_type"]
                            .as_str()
                            .unwrap_or("unknown")
                            .to_string(),
                        id: item["source_id"].as_i64().unwrap_or(0) as i32,
                        title: item["relevance_reason"]
                            .as_str()
                            .unwrap_or("")
                            .to_string(),
                        section: None,
                        domain_tags: Vec::new(),
                    },
                    related: Vec::new(),
                })
                .collect();
        }
    }

    // If JSON parsing fails, return the whole response as a single result
    if !response.trim().is_empty() {
        vec![RagResult {
            content: response.to_string(),
            score: 1.0,
            source: RagSource {
                source_type: "agent".to_string(),
                id: 0,
                title: "RAGRetriever synthesis".to_string(),
                section: None,
                domain_tags: Vec::new(),
            },
            related: Vec::new(),
        }]
    } else {
        Vec::new()
    }
}
