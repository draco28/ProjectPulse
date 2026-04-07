use anyhow::{Context, Result};
use sqlx::PgPool;

// Build knowledge graph relations between chunks after ingestion.
// Relations are stored in the `rag_relations` table.

/// Build `Elaborates` relations between sequential chunks from the same source.
/// Adjacent chunks (chunk_index N and N+1) from the same source_type+source_id
/// are connected with an Elaborates relation.
pub async fn build_sequential_relations(db: &PgPool, project_id: i32) -> Result<usize> {
    let result = sqlx::query(
        r#"
        INSERT INTO rag_relations (from_chunk_id, to_chunk_id, relation_type, weight)
        SELECT
            c1.id AS from_chunk_id,
            c2.id AS to_chunk_id,
            'Elaborates' AS relation_type,
            0.9 AS weight
        FROM rag_chunks c1
        JOIN rag_chunks c2
            ON c1.project_id = c2.project_id
            AND c1.source_type = c2.source_type
            AND c1.source_id = c2.source_id
            AND c2.chunk_index = c1.chunk_index + 1
        WHERE c1.project_id = $1
            AND c1.total_chunks > 1
        ON CONFLICT (from_chunk_id, to_chunk_id, relation_type) DO NOTHING
        "#,
    )
    .bind(project_id)
    .execute(db)
    .await
    .context("failed to build sequential Elaborates relations")?;

    Ok(result.rows_affected() as usize)
}

/// Build `References` relations between Ticket chunks and WikiPage chunks.
/// Uses the `TicketWikiPageLink` join table in PostgreSQL.
pub async fn build_ticket_wiki_relations(db: &PgPool, project_id: i32) -> Result<usize> {
    let result = sqlx::query(
        r#"
        INSERT INTO rag_relations (from_chunk_id, to_chunk_id, relation_type, weight)
        SELECT DISTINCT
            tc.id AS from_chunk_id,
            wc.id AS to_chunk_id,
            'References' AS relation_type,
            0.8 AS weight
        FROM ticket_wiki_page_links twl
        JOIN rag_chunks tc
            ON tc.source_type = 'ticket'
            AND tc.source_id = twl."ticketId"
            AND tc.project_id = $1
        JOIN rag_chunks wc
            ON wc.source_type = 'wiki'
            AND wc.source_id = twl."wikiPageId"
            AND wc.project_id = $1
        ON CONFLICT (from_chunk_id, to_chunk_id, relation_type) DO NOTHING
        "#,
    )
    .bind(project_id)
    .execute(db)
    .await
    .context("failed to build Ticket→Wiki References relations")?;

    Ok(result.rows_affected() as usize)
}

/// Build `References` relations between Ticket chunks and KnowledgeItem chunks.
/// Uses the `TicketKnowledgeLink` join table.
pub async fn build_ticket_knowledge_relations(db: &PgPool, project_id: i32) -> Result<usize> {
    let result = sqlx::query(
        r#"
        INSERT INTO rag_relations (from_chunk_id, to_chunk_id, relation_type, weight)
        SELECT DISTINCT
            tc.id AS from_chunk_id,
            kc.id AS to_chunk_id,
            'References' AS relation_type,
            0.8 AS weight
        FROM ticket_knowledge_links tkl
        JOIN rag_chunks tc
            ON tc.source_type = 'ticket'
            AND tc.source_id = tkl."ticketId"
            AND tc.project_id = $1
        JOIN rag_chunks kc
            ON kc.source_type = 'knowledge'
            AND kc.source_id = tkl."knowledgeItemId"
            AND kc.project_id = $1
        ON CONFLICT (from_chunk_id, to_chunk_id, relation_type) DO NOTHING
        "#,
    )
    .bind(project_id)
    .execute(db)
    .await
    .context("failed to build Ticket→Knowledge References relations")?;

    Ok(result.rows_affected() as usize)
}

/// Build `Supports` relations between Skill chunks and KnowledgeItem chunks.
/// Uses the `SkillKnowledgeLink` join table.
pub async fn build_skill_knowledge_relations(db: &PgPool, project_id: i32) -> Result<usize> {
    let result = sqlx::query(
        r#"
        INSERT INTO rag_relations (from_chunk_id, to_chunk_id, relation_type, weight)
        SELECT DISTINCT
            sc.id AS from_chunk_id,
            kc.id AS to_chunk_id,
            'Supports' AS relation_type,
            0.7 AS weight
        FROM skill_knowledge_links skl
        JOIN rag_chunks sc
            ON sc.source_type = 'skill'
            AND sc.source_id = skl.skill_id
            AND sc.project_id = $1
        JOIN rag_chunks kc
            ON kc.source_type = 'knowledge'
            AND kc.source_id = skl.knowledge_id
            AND kc.project_id = $1
        ON CONFLICT (from_chunk_id, to_chunk_id, relation_type) DO NOTHING
        "#,
    )
    .bind(project_id)
    .execute(db)
    .await
    .context("failed to build Skill→Knowledge Supports relations")?;

    Ok(result.rows_affected() as usize)
}

/// Build all relation types for a project after ingestion.
pub async fn build_all_relations(db: &PgPool, project_id: i32) -> Result<RelationBuildResult> {
    let sequential = build_sequential_relations(db, project_id).await?;
    let ticket_wiki = build_ticket_wiki_relations(db, project_id).await?;
    let ticket_knowledge = build_ticket_knowledge_relations(db, project_id).await?;
    let skill_knowledge = build_skill_knowledge_relations(db, project_id).await?;

    Ok(RelationBuildResult {
        sequential,
        ticket_wiki,
        ticket_knowledge,
        skill_knowledge,
        total: sequential + ticket_wiki + ticket_knowledge + skill_knowledge,
    })
}

/// Result of building all relations.
#[derive(Debug)]
pub struct RelationBuildResult {
    pub sequential: usize,
    pub ticket_wiki: usize,
    pub ticket_knowledge: usize,
    pub skill_knowledge: usize,
    pub total: usize,
}
