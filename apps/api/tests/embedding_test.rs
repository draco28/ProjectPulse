use projectpulse_api::services::embeddings::EmbeddingService;

// ============================================================================
// Embedding Service tests.
// Unit tests use a mock approach (check construction + dimension validation).
// Integration test hits real Ollama (skipped if unavailable).
// ============================================================================

#[test]
fn test_embedding_service_from_env_defaults() {
    // Should create with defaults without panicking
    let svc = EmbeddingService::from_env();
    assert_eq!(svc.dimensions(), 768);
}

#[test]
fn test_embedding_service_custom_config() {
    let svc = EmbeddingService::new(
        "http://localhost:11434".to_string(),
        "nomic-embed-text".to_string(),
        768,
    );
    assert_eq!(svc.dimensions(), 768);
}

#[test]
fn test_embedding_service_custom_dimensions() {
    let svc = EmbeddingService::new(
        "http://localhost:11434".to_string(),
        "all-minilm".to_string(),
        384,
    );
    assert_eq!(svc.dimensions(), 384);
}

/// Integration test: hit real Ollama if available.
/// Skips gracefully if Ollama is not running.
#[tokio::test]
async fn test_embed_real_ollama() {
    let svc = EmbeddingService::from_env();

    match svc.embed("test embedding for RAG pipeline").await {
        Ok(embedding) => {
            assert_eq!(
                embedding.len(),
                768,
                "nomic-embed-text should return 768-dim, got {}",
                embedding.len()
            );

            // Embedding should be normalized (L2 norm ≈ 1.0)
            let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
            assert!(
                (norm - 1.0).abs() < 0.1,
                "embedding should be approximately L2-normalized, got norm={}",
                norm
            );
        }
        Err(e) => {
            let err_msg = format!("{}", e);
            if err_msg.contains("connect") || err_msg.contains("Connection refused") {
                eprintln!("Skipping: Ollama not available at localhost:11434");
                return;
            }
            panic!("unexpected embedding error: {}", e);
        }
    }
}

/// Integration test: batch embedding.
#[tokio::test]
async fn test_embed_batch_real_ollama() {
    let svc = EmbeddingService::from_env();

    let texts = &[
        "authentication middleware",
        "database schema design",
        "React component patterns",
    ];

    match svc.embed_batch(texts).await {
        Ok(embeddings) => {
            assert_eq!(embeddings.len(), 3, "should return 3 embeddings");
            for (i, emb) in embeddings.iter().enumerate() {
                assert_eq!(
                    emb.len(),
                    768,
                    "embedding[{}] should be 768-dim, got {}",
                    i,
                    emb.len()
                );
            }
        }
        Err(e) => {
            let err_msg = format!("{}", e);
            if err_msg.contains("connect") || err_msg.contains("Connection refused") {
                eprintln!("Skipping: Ollama not available");
                return;
            }
            panic!("unexpected batch embedding error: {}", e);
        }
    }
}

#[tokio::test]
async fn test_embed_empty_batch() {
    let svc = EmbeddingService::from_env();
    let result = svc.embed_batch(&[]).await;
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}
