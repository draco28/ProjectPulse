-- ============================================================================
-- ProjectPulse - PostgreSQL Initialization Script
-- ============================================================================
-- This script runs automatically when the PostgreSQL container starts
-- for the FIRST TIME (via docker-entrypoint-initdb.d/)
--
-- Purpose: Install required extensions for ProjectPulse functionality
-- ============================================================================

-- Print startup message
\echo '=================================='
\echo 'ProjectPulse - Database Initialization'
\echo '=================================='

-- ============================================================================
-- EXTENSION: pgvector
-- ============================================================================
-- Purpose: Vector similarity search for semantic embeddings
-- Use Case: Semantic search for issues, knowledge base articles, code snippets
-- Documentation: https://github.com/pgvector/pgvector
--
-- Features:
-- - Store 384-dimensional embeddings (from all-MiniLM-L6-v2 model)
-- - Cosine similarity search (1 - (embedding <=> query) as similarity)
-- - Index support for faster queries (ivfflat, hnsw)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

\echo 'Installed extension: vector (pgvector for semantic search)'

-- ============================================================================
-- EXTENSION: pg_trgm
-- ============================================================================
-- Purpose: Trigram-based text similarity and fuzzy matching
-- Use Case: Full-text search with typo tolerance, autocomplete suggestions
-- Documentation: https://www.postgresql.org/docs/current/pgtrgm.html
--
-- Features:
-- - Fuzzy text matching with similarity() function
-- - GIN/GiST indexes for fast text search
-- - Support for LIKE '%pattern%' queries with indexes
-- - Trigram-based distance calculations
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

\echo 'Installed extension: pg_trgm (trigram text search)'

-- ============================================================================
-- EXTENSION: uuid-ossp
-- ============================================================================
-- Purpose: Generate UUIDs (Universally Unique Identifiers)
-- Use Case: Future use for secure, non-sequential IDs (e.g., public API keys)
-- Documentation: https://www.postgresql.org/docs/current/uuid-ossp.html
--
-- Features:
-- - UUID v1: Timestamp-based UUIDs
-- - UUID v4: Random UUIDs (most common)
-- - UUID v5: Namespace-based UUIDs (SHA-1 hash)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\echo 'Installed extension: uuid-ossp (UUID generation)'

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- List all installed extensions
\echo '=================================='
\echo 'Installed Extensions:'
\echo '=================================='

SELECT extname AS "Extension",
       extversion AS "Version",
       nspname AS "Schema"
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('vector', 'pg_trgm', 'uuid-ossp')
ORDER BY extname;

-- ============================================================================
-- DATABASE CONFIGURATION
-- ============================================================================
-- Set optimal configuration for DevHub workload

-- Shared buffers: Increase for better caching (default: 128MB -> 256MB)
-- Note: Docker default is 128MB, this is a recommendation for production
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Work memory: Increase for complex queries (default: 4MB -> 16MB)
-- Helps with sorting and hash joins in search queries
-- ALTER SYSTEM SET work_mem = '16MB';

-- Maintenance work memory: Increase for faster index creation (default: 64MB -> 128MB)
-- ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Enable JIT compilation for faster query execution (PostgreSQL 11+)
-- ALTER SYSTEM SET jit = on;

-- Log slow queries for performance monitoring (queries > 1 second)
-- ALTER SYSTEM SET log_min_duration_statement = 1000;

\echo '=================================='
\echo 'Database configuration complete!'
\echo '=================================='
\echo 'Extensions installed successfully.'
\echo 'You can verify with: SELECT * FROM pg_extension;'
\echo '=================================='

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Apply Prisma schema: pnpm prisma migrate dev
-- 2. Generate Prisma client: pnpm prisma generate
-- 3. Seed initial data: pnpm prisma db seed
-- 4. Verify database health: docker exec projectpulse-db psql -U projectpulse -d projectpulse -c '\dx'
-- ============================================================================
