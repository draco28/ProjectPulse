mod common;

use pulsedb::{AgentId, ExperienceType, NewExperience};

// ============================================================================
// Database Integration Tests
// ============================================================================

#[tokio::test]
async fn test_postgres_connection() {
    let (state, _dir) = common::test_state().await;

    let result: (i32,) = sqlx::query_as("SELECT 1")
        .fetch_one(&state.db)
        .await
        .expect("PostgreSQL query failed");

    assert_eq!(result.0, 1);
}

#[tokio::test]
async fn test_pulsedb_collective_exists() {
    let (state, _dir) = common::test_state().await;

    // Access PulseDB via HiveMind substrate (async SubstrateProvider)
    let collectives = state
        .hive
        .substrate()
        .list_collectives()
        .await
        .expect("failed to list collectives");

    assert!(
        collectives.iter().any(|c| c.name == "projectpulse"),
        "default 'projectpulse' collective should exist"
    );
}

#[tokio::test]
async fn test_pulsedb_store_and_retrieve_experience() {
    let (state, _dir) = common::test_state().await;

    let substrate = state.hive.substrate();

    let collectives = substrate.list_collectives().await.unwrap();
    let collective = collectives
        .iter()
        .find(|c| c.name == "projectpulse")
        .expect("projectpulse collective not found");

    let experience = NewExperience {
        collective_id: collective.id,
        content: "Test experience from integration test".to_string(),
        domain: vec!["test".to_string()],
        experience_type: ExperienceType::Fact {
            statement: "Integration tests verify database connectivity".to_string(),
            source: "integration-test".to_string(),
        },
        importance: 0.5,
        confidence: 1.0,
        source_agent: AgentId::new("projectpulse-api-test"),
        source_task: None,
        embedding: None,
        related_files: vec![],
    };

    let exp_id = substrate
        .store_experience(experience)
        .await
        .expect("failed to store experience");

    let retrieved = substrate
        .get_experience(exp_id)
        .await
        .expect("failed to get experience")
        .expect("experience should exist");

    assert_eq!(retrieved.content, "Test experience from integration test");
    assert_eq!(retrieved.collective_id, collective.id);
}

#[tokio::test]
async fn test_pulsedb_list_experiences() {
    let (state, _dir) = common::test_state().await;

    let substrate = state.hive.substrate();

    let collectives = substrate.list_collectives().await.unwrap();
    let collective = collectives
        .iter()
        .find(|c| c.name == "projectpulse")
        .unwrap();

    let experience = NewExperience {
        collective_id: collective.id,
        content: "Listable test experience".to_string(),
        domain: vec!["test".to_string()],
        experience_type: ExperienceType::Generic { category: None },
        importance: 0.5,
        confidence: 1.0,
        source_agent: AgentId::new("projectpulse-api-test"),
        source_task: None,
        embedding: None,
        related_files: vec![],
    };
    substrate.store_experience(experience).await.unwrap();

    let experiences = substrate
        .list_experiences(collective.id, 10, 0)
        .await
        .expect("list_experiences failed");

    assert!(
        !experiences.is_empty(),
        "should have at least one experience"
    );
}
