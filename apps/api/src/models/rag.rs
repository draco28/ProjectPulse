use serde::{Deserialize, Serialize};

// ============================================================================
// Ingestion types
// ============================================================================

/// Valid content source types for ingestion.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    Wiki,
    Ticket,
    Sop,
    Skill,
    Document,
    Knowledge,
    All,
}

/// Request body for `POST /api/v1/rag/ingest`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestRequest {
    /// Content source type to ingest.
    pub source_type: SourceType,

    /// Project ID to scope the ingestion.
    pub project_id: i32,

    /// Optional: inline content for single-document ingestion (testing/ad-hoc).
    /// When provided, ingests this content directly instead of reading from DB.
    pub content: Option<String>,

    /// Optional: title for inline content.
    pub title: Option<String>,

    /// Optional: source ID for inline content (links back to original record).
    pub source_id: Option<i32>,
}

/// Response for `POST /api/v1/rag/ingest`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestResponse {
    pub job_id: String,
    pub status: String,
    pub source_type: SourceType,
    pub project_id: i32,
}

/// Response for `GET /api/v1/rag/ingest/status`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestStatusResponse {
    pub job_id: String,
    pub status: String,
    pub processed: usize,
    pub total: usize,
    pub errors: Vec<String>,
}

// ============================================================================
// Search types
// ============================================================================

/// Query parameters for `GET /api/v1/rag/search`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchParams {
    /// The search query (natural language).
    pub query: Option<String>,

    /// Project ID to scope the search.
    pub project_id: i32,

    /// Maximum number of results to return (default: 10).
    pub limit: Option<usize>,

    /// Optional: filter by source types (comma-separated).
    pub source_types: Option<String>,

    /// Whether to include graph relations in results (default: true).
    pub include_relations: Option<bool>,
}

/// Options passed to the RagService search method.
#[derive(Debug, Clone)]
pub struct SearchOptions {
    pub project_id: i32,
    pub limit: usize,
    pub source_types: Option<Vec<String>>,
    pub include_relations: bool,
}

impl From<&SearchParams> for SearchOptions {
    fn from(params: &SearchParams) -> Self {
        Self {
            project_id: params.project_id,
            limit: params.limit.unwrap_or(10).min(100),
            source_types: params
                .source_types
                .as_ref()
                .map(|s| s.split(',').map(|t| t.trim().to_string()).collect()),
            include_relations: params.include_relations.unwrap_or(true),
        }
    }
}

/// A single RAG search result.
#[derive(Debug, Serialize)]
pub struct RagResult {
    /// The chunk text content.
    pub content: String,

    /// Relevance score (0.0–1.0, higher is better).
    pub score: f64,

    /// Source metadata — where this chunk came from.
    pub source: RagSource,

    /// Related chunks connected via knowledge graph.
    pub related: Vec<RelatedChunk>,
}

/// Source metadata for a RAG result.
#[derive(Debug, Serialize)]
pub struct RagSource {
    /// Content source type (wiki, ticket, sop, skill, document, knowledge).
    #[serde(rename = "type")]
    pub source_type: String,

    /// Original source record ID in PostgreSQL.
    pub id: i32,

    /// Title of the source document.
    pub title: String,

    /// Section title within the document (for section-based chunks).
    pub section: Option<String>,

    /// Domain tags from ingestion.
    pub domain_tags: Vec<String>,
}

/// A related chunk connected via knowledge graph relation.
#[derive(Debug, Serialize)]
pub struct RelatedChunk {
    /// Relation type (Elaborates, Supports, Contradicts, Supersedes, References).
    pub relation: String,

    /// Content source type of the related chunk.
    #[serde(rename = "type")]
    pub source_type: String,

    /// Source record ID.
    pub id: i32,

    /// Title of the related source.
    pub title: String,
}

/// Response for `GET /api/v1/rag/search`.
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<RagResult>,
    pub metadata: SearchMetadata,
}

/// Search response metadata.
#[derive(Debug, Serialize)]
pub struct SearchMetadata {
    /// Search strategy used (hybrid, semantic, keyword, recent).
    pub strategy: String,

    /// Time taken in milliseconds.
    pub search_time_ms: u64,
}

// ============================================================================
// Context assembly types
// ============================================================================

/// Assembled context for a task, within a token budget.
#[derive(Debug, Serialize)]
pub struct RagContext {
    /// Pre-formatted markdown context.
    pub context: String,

    /// Source attributions.
    pub sources: Vec<RagSource>,

    /// Approximate token count.
    pub token_count: usize,
}
