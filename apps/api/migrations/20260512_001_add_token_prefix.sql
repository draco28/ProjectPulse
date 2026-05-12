-- Sprint 9: Auth token prefix optimization
--
-- Problem: /api/v1/agent-auth/validate fetches ALL non-revoked tokens and
-- bcrypt-verifies sequentially. With N tokens this is O(N x 100ms) per request.
--
-- Fix: Add an 8-char prefix column. Auth validation queries by prefix first,
-- narrowing to typically 1 candidate before bcrypt.
--
-- Security: 8 chars of an otherwise-random token leaves ~10^14 brute-force
-- space; not sensitive. Legacy tokens with NULL prefix fall back to full scan
-- for backward compatibility.
--
-- Note: Prisma uses camelCase column names mapped to PostgreSQL.

ALTER TABLE project_tokens ADD COLUMN IF NOT EXISTS token_prefix VARCHAR(8);

-- Partial index: only non-revoked tokens (matches the validation query filter).
--
-- Note: We can't add "expiresAt > NOW()" to the predicate because NOW() is
-- STABLE, not IMMUTABLE, and PostgreSQL forbids non-IMMUTABLE functions in
-- index predicates. Expired tokens with a matching prefix will still be
-- fetched and bcrypt-verified — but in practice operators revoke tokens on
-- expiry, so the population stays small. If this becomes a hotspot, switch
-- to revoke-on-expiry in a background job.
CREATE INDEX IF NOT EXISTS idx_project_tokens_prefix
    ON project_tokens (token_prefix)
    WHERE "isRevoked" = false;
