use tokio::sync::broadcast;

/// Events emitted when content is created, updated, or deleted.
///
/// Sprint 4: Used for auto-ingest (background chunk+embed on content change).
/// Sprint 5: PulseHive agents can subscribe to content events.
/// Sprint 8: Chat agent can react to content changes in real-time.
#[derive(Debug, Clone)]
pub enum ContentEvent {
    Created {
        source_type: String,
        source_id: i32,
        project_id: i32,
    },
    Updated {
        source_type: String,
        source_id: i32,
        project_id: i32,
    },
    Deleted {
        source_type: String,
        source_id: i32,
        project_id: i32,
    },
}

/// Create a broadcast channel for content events.
/// Capacity of 256 — events are lightweight and consumers should process quickly.
pub fn create_channel() -> (broadcast::Sender<ContentEvent>, broadcast::Receiver<ContentEvent>) {
    broadcast::channel(256)
}

impl ContentEvent {
    pub fn source_type(&self) -> &str {
        match self {
            ContentEvent::Created { source_type, .. }
            | ContentEvent::Updated { source_type, .. }
            | ContentEvent::Deleted { source_type, .. } => source_type,
        }
    }

    pub fn source_id(&self) -> i32 {
        match self {
            ContentEvent::Created { source_id, .. }
            | ContentEvent::Updated { source_id, .. }
            | ContentEvent::Deleted { source_id, .. } => *source_id,
        }
    }

    pub fn project_id(&self) -> i32 {
        match self {
            ContentEvent::Created { project_id, .. }
            | ContentEvent::Updated { project_id, .. }
            | ContentEvent::Deleted { project_id, .. } => *project_id,
        }
    }
}
