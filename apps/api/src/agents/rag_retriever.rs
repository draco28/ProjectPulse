use std::sync::Arc;

use pulsehive::agent::{AgentDefinition, AgentKind, LlmAgentConfig};
use pulsehive::lens::Lens;
use pulsehive::llm::LlmConfig;
use pulsehive::tool::Tool;
use sqlx::PgPool;

use crate::agents::tools::graph_traversal::GraphTraversalTool;
use crate::agents::tools::pgvector_search::PgVectorSearchTool;
use crate::agents::tools::pulsedb_insights::PulseDBInsightsTool;
use crate::agents::tools::ticket_lookup::TicketLookupTool;

/// Build the RAGRetriever agent definition.
///
/// This agent performs multi-step retrieval for complex queries:
/// 1. Searches pgvector rag_chunks via hybrid search
/// 2. Follows knowledge graph relations for deeper context
/// 3. Looks up structured ticket data when referenced
/// 4. Checks PulseDB for past agent insights on the topic
/// 5. Synthesizes findings into a ranked response
pub fn rag_retriever_agent(db: PgPool, llm_provider: &str, llm_model: &str) -> AgentDefinition {
    let mut lens = Lens::new(["retrieval", "search", "knowledge"]);
    lens.attention_budget = 30;

    AgentDefinition {
        name: "RAGRetriever".into(),
        kind: AgentKind::Llm(Box::new(LlmAgentConfig {
            system_prompt: concat!(
                "You are a retrieval specialist for ProjectPulse. ",
                "Given a user query, search the knowledge base for the most relevant context.\n\n",
                "Available tools:\n",
                "- search_content: Semantic+keyword hybrid search across wiki, tickets, SOPs, skills\n",
                "- follow_relations: Traverse the knowledge graph from a chunk to find related content\n",
                "- lookup_ticket: Get structured ticket details (status, sprint, assignee)\n",
                "- check_insights: Check past agent experiences and learned patterns\n\n",
                "Strategy:\n",
                "1. Start with search_content for the main query\n",
                "2. If results reference specific tickets, use lookup_ticket for details\n",
                "3. Use follow_relations on the most relevant results for deeper context\n",
                "4. Use check_insights to see if agents have learned about this topic before\n",
                "5. Synthesize all findings into a ranked summary with source citations\n\n",
                "Return your findings as a JSON array of objects with: content, source_type, source_id, relevance_reason"
            )
            .into(),
            tools: vec![
                Arc::new(PgVectorSearchTool { db: db.clone() }) as Arc<dyn Tool>,
                Arc::new(GraphTraversalTool { db: db.clone() }),
                Arc::new(TicketLookupTool { db }),
                Arc::new(PulseDBInsightsTool),
            ],
            lens,
            llm_config: LlmConfig::new(llm_provider, llm_model),
            experience_extractor: None,
            refresh_every_n_tool_calls: Some(3),
        })),
    }
}
