mod common;

use projectpulse_api::services::rag_search;

// ============================================================================
// PulseHive Agent Integration Tests (Sprint 5)
//
// test_adaptive_router_classifies_correctly — DETERMINISTIC (always runs)
// test_rag_retriever_* — LLM-GATED (requires LLM_API_KEY env var)
// ============================================================================

/// Skip test if LLM API key not available.
fn _require_llm_key() -> Option<String> {
    std::env::var("LLM_API_KEY").ok()
}

// ---------------------------------------------------------------------------
// Deterministic test (no LLM needed)
// ---------------------------------------------------------------------------

/// AdaptiveRAG heuristic router classifies queries correctly.
/// Simple queries → fast path, complex queries → agent path.
#[test]
fn test_adaptive_router_classifies_correctly() {
    use rag_search::QueryComplexity;

    // Simple queries (≤4 words, no reasoning/temporal indicators)
    assert!(matches!(
        rag_search::classify_complexity("auth"),
        QueryComplexity::Simple
    ));
    assert!(matches!(
        rag_search::classify_complexity("database schema"),
        QueryComplexity::Simple
    ));
    assert!(matches!(
        rag_search::classify_complexity("JWT token"),
        QueryComplexity::Simple
    ));

    // Complex queries (temporal indicators)
    assert!(matches!(
        rag_search::classify_complexity("what changed between sprint 14 and 16"),
        QueryComplexity::Complex
    ));
    assert!(matches!(
        rag_search::classify_complexity("history of authentication changes since last month"),
        QueryComplexity::Complex
    ));

    // Complex queries (comparison indicators)
    assert!(matches!(
        rag_search::classify_complexity("compare pgvector vs qdrant for our use case"),
        QueryComplexity::Complex
    ));

    // Complex queries (reasoning indicators with >8 words)
    assert!(matches!(
        rag_search::classify_complexity("how does the authentication middleware work with bearer tokens and JWT validation"),
        QueryComplexity::Complex
    ));
    assert!(matches!(
        rag_search::classify_complexity("why did we choose pgvector instead of qdrant for the RAG pipeline"),
        QueryComplexity::Complex
    ));

    // Complex queries (multi-entity references)
    assert!(matches!(
        rag_search::classify_complexity("relationship between ticket #42 and ticket #55"),
        QueryComplexity::Complex
    ));

    // Moderate queries (reasoning but short)
    assert!(matches!(
        rag_search::classify_complexity("why pgvector"),
        QueryComplexity::Moderate
    ));
}

// ---------------------------------------------------------------------------
// LLM-gated tests (require LLM_API_KEY env var)
// ---------------------------------------------------------------------------

/// RAGRetriever agent finds relevant results for a query.
#[tokio::test]
async fn test_rag_retriever_finds_relevant() {
    let Some(_api_key) = _require_llm_key() else {
        eprintln!("Skipping test_rag_retriever_finds_relevant: LLM_API_KEY not set");
        return;
    };

    // TODO: Build HiveMind with test PulseDB + Ollama Cloud provider
    // Ingest test content into rag_chunks
    // Deploy RAGRetriever agent with query "authentication middleware"
    // Assert: agent returns results containing "JWT" or "auth"
    eprintln!("test_rag_retriever_finds_relevant: implementation pending (Sprint 5 #263)");
}

/// RAGRetriever agent follows knowledge graph relations.
#[tokio::test]
async fn test_rag_retriever_follows_relations() {
    let Some(_api_key) = _require_llm_key() else {
        eprintln!("Skipping test_rag_retriever_follows_relations: LLM_API_KEY not set");
        return;
    };

    // TODO: Ingest multi-section content with Elaborates relations
    // Deploy RAGRetriever with query that matches one section
    // Assert: agent calls follow_relations tool and returns connected sections
    eprintln!("test_rag_retriever_follows_relations: implementation pending (Sprint 5 #263)");
}

/// Lens domain focus filters agent perception correctly.
#[tokio::test]
async fn test_lens_filters_by_domain() {
    let Some(_api_key) = _require_llm_key() else {
        eprintln!("Skipping test_lens_filters_by_domain: LLM_API_KEY not set");
        return;
    };

    // TODO: Configure agent with Lens focused on "wiki" domain
    // Ingest wiki + ticket content
    // Assert: agent perceives wiki experiences more strongly than ticket
    eprintln!("test_lens_filters_by_domain: implementation pending (Sprint 5 #263)");
}
