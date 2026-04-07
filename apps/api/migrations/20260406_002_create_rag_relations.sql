-- RAG Relations table: typed knowledge graph edges between chunks.
-- Stores directed relations: from_chunk → to_chunk with a semantic type.
-- Used for graph-aware retrieval (single-hop expansion at search time).

CREATE TABLE IF NOT EXISTS rag_relations (
    id SERIAL PRIMARY KEY,
    from_chunk_id INT NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
    to_chunk_id INT NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL,  -- Elaborates, Supports, Contradicts, Supersedes, References
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate relations between same chunks with same type
    CONSTRAINT uq_rag_relations UNIQUE (from_chunk_id, to_chunk_id, relation_type)
);

-- Outgoing relations from a chunk
CREATE INDEX IF NOT EXISTS idx_rag_relations_from
    ON rag_relations (from_chunk_id);

-- Incoming relations to a chunk
CREATE INDEX IF NOT EXISTS idx_rag_relations_to
    ON rag_relations (to_chunk_id);

-- Filter by relation type
CREATE INDEX IF NOT EXISTS idx_rag_relations_type
    ON rag_relations (from_chunk_id, relation_type);
