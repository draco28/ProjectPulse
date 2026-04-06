use pulsedb::{
    AgentId, Config, ContextRequest, ExperienceType, InsightType, NewDerivedInsight,
    NewExperience, NewExperienceRelation, PulseDB, RelationDirection, RelationType,
};
use tempfile::TempDir;

// ============================================================================
// RED PHASE: TDD tests for PulseDB integration.
// These verify that PulseDB's experience, relation, and insight APIs work
// correctly for our agent experience store layer (Sprint 5+).
// ============================================================================

/// Create a test PulseDB instance with external embeddings (no ONNX download).
fn test_pulsedb() -> (PulseDB, TempDir) {
    let temp_dir = TempDir::new().expect("failed to create temp dir");
    let path = temp_dir
        .path()
        .join("test.pulsedb")
        .to_string_lossy()
        .to_string();

    let config = Config::with_external_embeddings(pulsedb::EmbeddingDimension::default());
    let db = PulseDB::open(&path, config).expect("failed to open PulseDB");

    db.create_collective("test-project")
        .expect("failed to create collective");

    (db, temp_dir)
}

/// Generate a deterministic L2-normalized 384-dim test embedding.
fn test_embedding(seed: f32) -> Vec<f32> {
    let mut embedding = vec![0.0f32; 384];
    for (i, val) in embedding.iter_mut().enumerate() {
        *val = ((i as f32 + seed) * 0.01).sin();
    }
    let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for val in &mut embedding {
            *val /= norm;
        }
    }
    embedding
}

/// get_context_candidates should return experiences from multiple sources:
/// similar (vector search), recent (temporal), and optionally insights.
#[test]
fn test_context_assembly() {
    let (db, _dir) = test_pulsedb();

    let collectives = db.list_collectives().expect("list collectives");
    let collective_id = collectives
        .iter()
        .find(|c| c.name == "test-project")
        .expect("test-project collective not found")
        .id;

    // Record several experiences with different types and domains
    let experiences = vec![
        (
            "Wiki: Authentication Guide",
            ExperienceType::TechInsight {
                technology: "auth".into(),
                insight: "JWT with RS256 is the standard".into(),
            },
            vec!["wiki", "auth"],
            1.0,
        ),
        (
            "Ticket: Fix JWT validation bug",
            ExperienceType::Solution {
                problem_ref: None,
                approach: "Added expiration check".into(),
                worked: true,
            },
            vec!["ticket", "bug"],
            2.0,
        ),
        (
            "SOP: Deploy authentication service",
            ExperienceType::Solution {
                problem_ref: None,
                approach: "Follow the deployment checklist".into(),
                worked: true,
            },
            vec!["sop", "deploy"],
            3.0,
        ),
        (
            "Skill: Rust JWT implementation pattern",
            ExperienceType::TechInsight {
                technology: "rust".into(),
                insight: "Use jsonwebtoken crate with RS256".into(),
            },
            vec!["skill", "rust"],
            4.0,
        ),
        (
            "Knowledge: Auth middleware architecture",
            ExperienceType::ArchitecturalDecision {
                decision: "Dual auth middleware".into(),
                rationale: "Support both JWT and bearer tokens".into(),
            },
            vec!["knowledge", "architecture"],
            5.0,
        ),
    ];

    for (content, exp_type, domains, seed) in &experiences {
        let embedding = test_embedding(*seed);
        db.record_experience(NewExperience {
            collective_id,
            content: content.to_string(),
            experience_type: exp_type.clone(),
            domain: domains.iter().map(|s| s.to_string()).collect(),
            embedding: Some(embedding),
            importance: 0.8,
            confidence: 0.9,
            source_agent: AgentId::new("test"),
            ..Default::default()
        })
        .expect("record experience failed");
    }

    // Query with an embedding similar to the auth-related experiences
    let query_embedding = test_embedding(1.0);

    let context = db
        .get_context_candidates(ContextRequest {
            collective_id,
            query_embedding,
            max_similar: 5,
            max_recent: 3,
            include_insights: true,
            include_relations: true,
            ..Default::default()
        })
        .expect("get_context_candidates failed");

    // Should return similar experiences (vector search)
    assert!(
        !context.similar_experiences.is_empty(),
        "context should include similar experiences from vector search"
    );

    // Should return recent experiences (temporal)
    assert!(
        !context.recent_experiences.is_empty(),
        "context should include recent experiences"
    );

    // Total context should include experiences from multiple types
    let total_unique = context.similar_experiences.len() + context.recent_experiences.len();
    assert!(
        total_unique >= 2,
        "context should assemble from multiple sources, got {}",
        total_unique
    );
}

/// PulseDB should correctly store and retrieve typed relations.
#[test]
fn test_relation_types() {
    let (db, _dir) = test_pulsedb();

    let collectives = db.list_collectives().expect("list collectives");
    let collective_id = collectives
        .iter()
        .find(|c| c.name == "test-project")
        .expect("test-project not found")
        .id;

    let exp1 = db
        .record_experience(NewExperience {
            collective_id,
            content: "Section 1: Introduction to authentication".into(),
            experience_type: ExperienceType::TechInsight {
                technology: "auth".into(),
                insight: "overview".into(),
            },
            domain: vec!["wiki".into()],
            embedding: Some(test_embedding(1.0)),
            importance: 0.8,
            confidence: 0.9,
            source_agent: AgentId::new("test"),
            ..Default::default()
        })
        .expect("record exp1 failed");

    let exp2 = db
        .record_experience(NewExperience {
            collective_id,
            content: "Section 2: JWT implementation details".into(),
            experience_type: ExperienceType::TechInsight {
                technology: "jwt".into(),
                insight: "details".into(),
            },
            domain: vec!["wiki".into()],
            embedding: Some(test_embedding(2.0)),
            importance: 0.8,
            confidence: 0.9,
            source_agent: AgentId::new("test"),
            ..Default::default()
        })
        .expect("record exp2 failed");

    let exp3 = db
        .record_experience(NewExperience {
            collective_id,
            content: "Contradicting: session-based auth is deprecated".into(),
            experience_type: ExperienceType::TechInsight {
                technology: "auth".into(),
                insight: "deprecation".into(),
            },
            domain: vec!["wiki".into()],
            embedding: Some(test_embedding(3.0)),
            importance: 0.7,
            confidence: 0.8,
            source_agent: AgentId::new("test"),
            ..Default::default()
        })
        .expect("record exp3 failed");

    // Store typed relations
    db.store_relation(NewExperienceRelation {
        source_id: exp1,
        target_id: exp2,
        relation_type: RelationType::Elaborates,
        strength: 0.9,
        metadata: None,
    })
    .expect("store Elaborates failed");

    db.store_relation(NewExperienceRelation {
        source_id: exp2,
        target_id: exp1,
        relation_type: RelationType::Supports,
        strength: 0.8,
        metadata: None,
    })
    .expect("store Supports failed");

    db.store_relation(NewExperienceRelation {
        source_id: exp3,
        target_id: exp1,
        relation_type: RelationType::Contradicts,
        strength: 0.7,
        metadata: None,
    })
    .expect("store Contradicts failed");

    // Verify outgoing relations from exp1
    let outgoing = db
        .get_related_experiences(exp1, RelationDirection::Outgoing)
        .expect("get outgoing failed");

    assert!(
        !outgoing.is_empty(),
        "exp1 should have outgoing relations"
    );
    assert!(
        outgoing
            .iter()
            .any(|(_exp, rel)| rel.relation_type == RelationType::Elaborates),
        "should find Elaborates relation from exp1"
    );

    // Verify incoming relations to exp1
    let incoming = db
        .get_related_experiences(exp1, RelationDirection::Incoming)
        .expect("get incoming failed");

    assert!(
        incoming
            .iter()
            .any(|(_exp, rel)| rel.relation_type == RelationType::Contradicts),
        "should find incoming Contradicts relation to exp1"
    );
}

/// store_insight should create a derived insight retrievable via context.
#[test]
fn test_insight_storage() {
    let (db, _dir) = test_pulsedb();

    let collectives = db.list_collectives().expect("list collectives");
    let collective_id = collectives
        .iter()
        .find(|c| c.name == "test-project")
        .expect("test-project not found")
        .id;

    let base_exp = db
        .record_experience(NewExperience {
            collective_id,
            content: "JWT tokens should use RS256 for production".into(),
            experience_type: ExperienceType::TechInsight {
                technology: "jwt".into(),
                insight: "Use RS256 signing".into(),
            },
            domain: vec!["auth".into()],
            embedding: Some(test_embedding(1.0)),
            importance: 0.9,
            confidence: 0.95,
            source_agent: AgentId::new("test"),
            ..Default::default()
        })
        .expect("record base experience failed");

    let insight_id = db
        .store_insight(NewDerivedInsight {
            collective_id,
            content: "Best practice: Always use RS256 (asymmetric) over HS256 (symmetric) for JWT signing in production.".into(),
            source_experience_ids: vec![base_exp],
            insight_type: InsightType::Pattern,
            confidence: 0.95,
            embedding: Some(test_embedding(1.1)),
            domain: vec!["auth".into(), "security".into()],
        })
        .expect("store insight failed");

    // InsightId is opaque — just verify it was created without error
    let _ = insight_id;

    // The insight should be retrievable via context candidates
    let context = db
        .get_context_candidates(ContextRequest {
            collective_id,
            query_embedding: test_embedding(1.05),
            max_similar: 5,
            include_insights: true,
            ..Default::default()
        })
        .expect("get context failed");

    assert!(
        !context.insights.is_empty(),
        "stored insight should appear in context candidates"
    );

    let insight_contents: Vec<&str> = context
        .insights
        .iter()
        .map(|i| i.content.as_str())
        .collect();

    assert!(
        insight_contents.iter().any(|c| c.contains("RS256")),
        "should find the RS256 insight in context, got: {:?}",
        insight_contents
    );
}
