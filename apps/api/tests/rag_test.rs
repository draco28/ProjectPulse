mod common;

use axum::http::header::AUTHORIZATION;
use axum::http::HeaderValue;
use axum_test::TestServer;
use projectpulse_api::build_router;
use serde_json::{json, Value};

/// Helper: build a test server with real database connections.
async fn test_server() -> (TestServer, tempfile::TempDir) {
    let (state, temp_dir) = common::test_state().await;
    let app = build_router(state);
    let server = TestServer::new(app).expect("failed to create test server");
    (server, temp_dir)
}

/// Helper: create a bearer auth HeaderValue.
fn bearer_auth() -> HeaderValue {
    let token = common::create_test_jwt("test-user-1", "test@example.com", "admin");
    format!("Bearer {}", token).parse().unwrap()
}

// ============================================================================
// RED PHASE: TDD tests for the RAG pipeline.
// These define the CONTRACT before implementation.
// All tests should FAIL initially (routes return 404 or wrong data).
// ============================================================================

// ---------------------------------------------------------------------------
// Chunking Tests
// ---------------------------------------------------------------------------

/// Long text should be split into multiple chunks at ~512 token boundaries.
#[tokio::test]
async fn test_chunking_text_512_tokens() {
    let (server, _dir) = test_server().await;

    // Create a long wiki-like text (~2000 tokens / ~8000 chars)
    let long_text = "# Architecture Overview\n\n".to_string()
        + &"This is a paragraph about the system architecture that contains important details about how components interact with each other. ".repeat(60);

    let response = server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "sourceType": "wiki",
            "projectId": 6,
            "content": long_text,
            "title": "Test Architecture Doc",
            "sourceId": 9999
        }))
        .await;

    assert!(
        response.status_code().is_success(),
        "POST /api/v1/rag/ingest should return 2xx, got {}",
        response.status_code()
    );

    // Search for the content — should return multiple chunks (not one giant doc)
    let search_response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "architecture components interact")
        .add_query_param("projectId", "6")
        .add_query_param("limit", "20")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    let body: Value = search_response.json();
    let results = body["results"].as_array().expect("results should be an array");

    // Long text (~2000 tokens) should produce multiple chunks (~4 at 512 tokens)
    assert!(
        results.len() > 1,
        "long text should be split into multiple chunks, got {} results",
        results.len()
    );

    // Each chunk content should be < ~600 tokens (~3000 chars with overflow)
    for result in results {
        let content = result["content"].as_str().unwrap_or("");
        assert!(
            content.len() < 3000,
            "chunk should be < ~600 tokens (~3000 chars), got {} chars",
            content.len()
        );
    }
}

/// Section-based chunking should preserve markdown header boundaries.
#[tokio::test]
async fn test_chunking_preserves_sections() {
    let (server, _dir) = test_server().await;

    let markdown_content = r#"# Authentication Guide

## JWT Middleware
The JWT middleware validates tokens on every request. It checks the signature using RS256 and verifies expiration.

## Bearer Token Auth
Bearer tokens are project-scoped. Each token has an allowlist and blocklist for tool access.

## Session Management
Sessions are stored in PostgreSQL with automatic expiry after 4 hours of inactivity.
"#;

    server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "sourceType": "wiki",
            "projectId": 6,
            "content": markdown_content,
            "title": "Authentication Guide",
            "sourceId": 9998
        }))
        .await;

    // Search for JWT — should return the JWT section, not the whole doc
    let search_response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "JWT middleware validates tokens")
        .add_query_param("projectId", "6")
        .add_query_param("limit", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    let body: Value = search_response.json();
    let results = body["results"].as_array().expect("results should be an array");

    assert!(!results.is_empty(), "should find results for JWT query");

    // Top result should contain JWT section content
    let top_content = results[0]["content"].as_str().unwrap_or("");
    assert!(
        top_content.contains("JWT") || top_content.contains("jwt"),
        "top result should contain JWT section content, got: {}",
        &top_content[..top_content.len().min(200)]
    );

    // Verify section metadata is preserved
    let source = &results[0]["source"];
    assert!(
        source["section"].is_string(),
        "chunk should have section metadata"
    );
}

// ---------------------------------------------------------------------------
// Ingestion Tests
// ---------------------------------------------------------------------------

/// Ingesting wiki pages should create searchable chunks in the RAG index.
#[tokio::test]
async fn test_ingest_wiki_creates_experiences() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "sourceType": "wiki",
            "projectId": 6
        }))
        .await;

    let status = response.status_code();
    assert!(
        status.is_success(),
        "POST /api/v1/rag/ingest should return 2xx, got {}",
        status
    );

    let body: Value = response.json();
    assert!(
        body["jobId"].is_string() || body["job_id"].is_string(),
        "response should contain a job ID"
    );

    // After ingestion, searching should return wiki-sourced results
    let search_response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "projectpulse")
        .add_query_param("projectId", "6")
        .add_query_param("limit", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    let search_body: Value = search_response.json();
    let results = search_body["results"]
        .as_array()
        .expect("results should be an array");

    let wiki_results: Vec<&Value> = results
        .iter()
        .filter(|r| r["source"]["type"].as_str() == Some("wiki"))
        .collect();

    assert!(
        !wiki_results.is_empty(),
        "should find wiki-sourced results after ingestion"
    );
}

/// Ingesting tickets should create experiences with correct domain tags.
#[tokio::test]
async fn test_ingest_ticket_creates_experience() {
    let (server, _dir) = test_server().await;

    let response = server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "sourceType": "ticket",
            "projectId": 6
        }))
        .await;

    assert!(
        response.status_code().is_success(),
        "ticket ingestion should succeed, got {}",
        response.status_code()
    );

    let body: Value = response.json();
    assert!(
        body["jobId"].is_string() || body["job_id"].is_string(),
        "response should contain a job ID"
    );
}

/// Sequential chunks from same wiki page should have Elaborates relations.
#[tokio::test]
async fn test_ingest_builds_relations() {
    let (server, _dir) = test_server().await;

    let multi_section = r#"# API Design

## REST Endpoints
All endpoints follow REST conventions with JSON request/response bodies.

## Authentication
Every endpoint requires a valid JWT token or bearer token in the Authorization header.

## Error Handling
Errors return structured JSON with an error message and HTTP status code.
"#;

    server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({
            "sourceType": "wiki",
            "projectId": 6,
            "content": multi_section,
            "title": "API Design",
            "sourceId": 9997
        }))
        .await;

    let search_response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "REST endpoints JSON")
        .add_query_param("projectId", "6")
        .add_query_param("include_relations", "true")
        .add_query_param("limit", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    let body: Value = search_response.json();
    let results = body["results"].as_array().expect("results should be an array");

    assert!(!results.is_empty(), "should find results");

    let has_relations = results.iter().any(|r| {
        r["related"]
            .as_array()
            .map_or(false, |rel| !rel.is_empty())
    });

    assert!(
        has_relations,
        "sequential chunks from same page should have Elaborates relations"
    );
}

// ---------------------------------------------------------------------------
// Search Tests
// ---------------------------------------------------------------------------

/// Search should return results ranked by relevance score (RRF).
#[tokio::test]
async fn test_search_returns_ranked_results() {
    let (server, _dir) = test_server().await;

    server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "sourceType": "wiki", "projectId": 6 }))
        .await;

    let response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "authentication middleware")
        .add_query_param("projectId", "6")
        .add_query_param("limit", "10")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    let results = body["results"].as_array().expect("results should be an array");

    // Results sorted by score descending
    let scores: Vec<f64> = results
        .iter()
        .filter_map(|r| r["score"].as_f64())
        .collect();

    for window in scores.windows(2) {
        assert!(
            window[0] >= window[1],
            "results should be sorted by score descending: {} < {}",
            window[0],
            window[1]
        );
    }

    assert!(body["metadata"]["strategy"].is_string(), "strategy required");
    assert!(body["metadata"]["search_time_ms"].is_number(), "search_time_ms required");
}

/// Search with include_relations should return related chunks.
#[tokio::test]
async fn test_search_includes_graph_relations() {
    let (server, _dir) = test_server().await;

    server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "sourceType": "wiki", "projectId": 6 }))
        .await;

    let response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "database schema design")
        .add_query_param("projectId", "6")
        .add_query_param("include_relations", "true")
        .add_query_param("limit", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    let results = body["results"].as_array().expect("results should be an array");

    for result in results {
        assert!(result["related"].is_array(), "each result needs 'related' array");
        assert!(result["source"]["type"].is_string(), "source.type required");
        assert!(result["source"]["id"].is_number(), "source.id required");
        assert!(result["source"]["title"].is_string(), "source.title required");
    }
}

/// Empty query should return recent chunks (temporal fallback).
#[tokio::test]
async fn test_search_empty_query_returns_recent() {
    let (server, _dir) = test_server().await;

    server
        .post("/api/v1/rag/ingest")
        .add_header(AUTHORIZATION, bearer_auth())
        .json(&json!({ "sourceType": "wiki", "projectId": 6 }))
        .await;

    let response = server
        .get("/api/v1/rag/search")
        .add_query_param("query", "")
        .add_query_param("projectId", "6")
        .add_query_param("limit", "5")
        .add_header(AUTHORIZATION, bearer_auth())
        .await;

    response.assert_status_ok();

    let body: Value = response.json();
    let results = body["results"].as_array().expect("results should be an array");

    assert!(
        !results.is_empty(),
        "empty query should return recent chunks as fallback"
    );

    let strategy = body["metadata"]["strategy"].as_str().unwrap_or("");
    assert!(
        strategy == "recent" || strategy == "hybrid",
        "empty query strategy should be 'recent' or 'hybrid', got '{}'",
        strategy
    );
}
