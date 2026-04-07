pub mod rag_retriever;
pub mod tools;

use std::sync::Arc;

use pulsehive::error::Result;
use pulsehive::HiveMind;
use pulsehive_openai::{OpenAICompatibleProvider, OpenAIConfig};

use crate::config::Config;

/// Build and configure the PulseHive HiveMind for agent orchestration.
///
/// HiveMind owns PulseDB exclusively (opens via substrate_path).
/// LLM provider configured via Ollama Cloud Pro (configurable model).
pub fn build_hivemind(config: &Config) -> Result<Arc<HiveMind>> {
    let mut builder = HiveMind::builder()
        .substrate_path(&config.pulsedb_path);

    // Register LLM provider if API key is available
    if let Some(ref api_key) = config.llm_api_key {
        let provider = OpenAICompatibleProvider::new(
            OpenAIConfig::new(api_key, &config.llm_model)
                .with_base_url(&config.llm_base_url)
                .with_timeout(60),
        );
        builder = builder.llm_provider("ollama-cloud", provider);
    }

    let hive = builder.build()?;
    tracing::info!(
        model = %config.llm_model,
        base_url = %config.llm_base_url,
        "HiveMind initialized (PulseDB owned)"
    );

    Ok(Arc::new(hive))
}
