-- RAG Chunks table: unified chunked content index for pgvector hybrid search.
-- Stores chunks from all 6 content types (wiki, ticket, sop, skill, document, knowledge).
-- Each chunk has a 768-dim embedding (nomic-embed-text) and a tsvector for keyword search.

CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    source_type VARCHAR(20) NOT NULL,   -- wiki, ticket, sop, skill, document, knowledge
    source_id INT NOT NULL,             -- FK to original table (WikiPage.id, Ticket.id, etc.)
    chunk_index INT NOT NULL DEFAULT 0, -- Position within source document
    total_chunks INT NOT NULL DEFAULT 1,-- Total chunks from this source
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,  -- SHA256 for deduplication
    section_title VARCHAR(500),         -- Markdown header text for section-based chunks
    embedding vector(768) NOT NULL,     -- nomic-embed-text 768-dim via pgvector
    content_tsv tsvector NOT NULL,      -- BM25 keyword search via PostgreSQL
    domain_tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Deduplication: same content in same project won't be stored twice
    CONSTRAINT uq_rag_chunks_content UNIQUE (project_id, content_hash)
);

-- HNSW vector index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
    ON rag_chunks USING hnsw (embedding vector_cosine_ops);

-- GIN index for full-text keyword search (BM25)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv
    ON rag_chunks USING gin (content_tsv);

-- Project scoping (multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_project
    ON rag_chunks (project_id);

-- Source lookup (find all chunks from a specific source)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source
    ON rag_chunks (project_id, source_type, source_id);

-- Domain tag filtering
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tags
    ON rag_chunks USING gin (domain_tags);

-- Auto-generate tsvector from content on INSERT/UPDATE
CREATE OR REPLACE FUNCTION rag_chunks_tsv_trigger() RETURNS trigger AS $$
BEGIN
    NEW.content_tsv := to_tsvector('english', COALESCE(NEW.section_title, '') || ' ' || NEW.content);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rag_chunks_tsv
    BEFORE INSERT OR UPDATE OF content ON rag_chunks
    FOR EACH ROW
    EXECUTE FUNCTION rag_chunks_tsv_trigger();
