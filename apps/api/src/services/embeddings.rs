use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// HTTP client for Ollama's embedding API.
///
/// Reused across: ingestion (S4) → agent tools (S5) → chat context (S8).
#[derive(Clone)]
pub struct EmbeddingService {
    client: reqwest::Client,
    base_url: String,
    model: String,
    dimensions: usize,
}

#[derive(Serialize)]
struct EmbedRequest<'a> {
    model: &'a str,
    input: &'a str,
}

#[derive(Serialize)]
struct EmbedBatchRequest<'a> {
    model: &'a str,
    input: Vec<&'a str>,
}

#[derive(Deserialize)]
struct EmbedResponse {
    embeddings: Vec<Vec<f32>>,
}

impl EmbeddingService {
    /// Create a new EmbeddingService.
    pub fn new(base_url: String, model: String, dimensions: usize) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .connect_timeout(std::time::Duration::from_secs(5))
                .build()
                .expect("failed to build reqwest client"),
            base_url,
            model,
            dimensions,
        }
    }

    /// Create from environment variables with defaults.
    pub fn from_env() -> Self {
        Self::new(
            std::env::var("OLLAMA_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string()),
            std::env::var("EMBEDDING_MODEL")
                .unwrap_or_else(|_| "nomic-embed-text".to_string()),
            std::env::var("EMBEDDING_DIMENSIONS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(768),
        )
    }

    /// The configured embedding dimension.
    pub fn dimensions(&self) -> usize {
        self.dimensions
    }

    /// Generate an embedding for a single text.
    pub async fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let url = format!("{}/api/embed", self.base_url);

        let response = self
            .client
            .post(&url)
            .json(&EmbedRequest {
                model: &self.model,
                input: text,
            })
            .send()
            .await
            .context("failed to connect to Ollama")?;

        let body: EmbedResponse = response
            .json()
            .await
            .context("failed to parse Ollama embedding response")?;

        let vec = body
            .embeddings
            .into_iter()
            .next()
            .context("Ollama returned no embeddings")?;

        anyhow::ensure!(
            vec.len() == self.dimensions,
            "expected {}-dim embedding from Ollama model '{}', got {}-dim",
            self.dimensions,
            self.model,
            vec.len()
        );

        Ok(vec)
    }

    /// Generate embeddings for a batch of texts.
    pub async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        if texts.is_empty() {
            return Ok(Vec::new());
        }

        let url = format!("{}/api/embed", self.base_url);

        let response = self
            .client
            .post(&url)
            .json(&EmbedBatchRequest {
                model: &self.model,
                input: texts.to_vec(),
            })
            .send()
            .await
            .context("failed to connect to Ollama for batch embedding")?;

        let body: EmbedResponse = response
            .json()
            .await
            .context("failed to parse Ollama batch embedding response")?;

        for (i, vec) in body.embeddings.iter().enumerate() {
            anyhow::ensure!(
                vec.len() == self.dimensions,
                "batch embedding [{}]: expected {}-dim from Ollama model '{}', got {}-dim",
                i,
                self.dimensions,
                self.model,
                vec.len()
            );
        }

        Ok(body.embeddings)
    }
}
