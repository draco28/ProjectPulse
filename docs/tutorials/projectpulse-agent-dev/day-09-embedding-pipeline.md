# Day 09 — Embedding pipeline (Ollama/OpenAI, dimension consistency, failure handling)

## Goals (what you should understand today)

By the end of Day 09, you should be able to explain:

1. How ProjectPulse generates embeddings (the exact provider selection rules).
2. Why **dimension consistency** (768) is critical for pgvector schema stability.
3. How Ollama embeddings are called (endpoint, payload, timeouts, truncation).
4. How OpenAI embeddings are called (endpoint, payload, dimensions override, API key).
5. What breaks in production (and what error you see) when embeddings fail.

---

## Mental model: embeddings are an internal “indexing dependency”

Embeddings are not a feature by themselves.

They are a dependency of:

- knowledge ingestion (store embedding in `knowledge_items.embedding`)
- semantic search (compare query embedding to stored embeddings)
- hybrid search (semantic + full-text)

In interviews you can say:

- “We treat embeddings like an internal indexing step. If embeddings are unavailable, semantic/hybrid search can degrade or fail, but the data model stays stable.”

---

## Core design choice: always normalize to 768 dimensions

ProjectPulse standardizes on **768-dim vectors**.

Why:

- Postgres column is `vector(768)` (pgvector)
- swapping providers shouldn’t require schema migrations
- you can do “local-first” embeddings (Ollama) and still have a safe paid fallback (OpenAI)

Concrete implementation evidence:

- `apps/web/lib/embeddings/index.ts`
  - comment: “Provides consistent 768-dimensional embeddings regardless of provider.”

---

## Where the embedding pipeline is implemented (authoritative)

### 1) Unified embedding service (the orchestrator)

- `apps/web/lib/embeddings/index.ts`

Exports:

- `generateEmbedding(text, options?)`
- `generateBatchEmbeddings(texts, options?)`
- `checkEmbeddingProviders(options?)`

Provider selection logic:

- `provider: 'ollama'` → Ollama only (throw on failure)
- `provider: 'openai'` → OpenAI only (throw on failure)
- `provider: 'auto'` (default) → try Ollama first, fallback to OpenAI

Error type:

- `EmbeddingServiceError`

### 2) Ollama provider

- `apps/web/lib/embeddings/ollama.ts`

### 3) OpenAI provider

- `apps/web/lib/embeddings/openai.ts`

---

## Ollama provider details (local, preferred)

### Endpoint + payload

File:

- `apps/web/lib/embeddings/ollama.ts`

It calls:

- `POST ${baseUrl}/api/embeddings`

JSON body:

- `model`: defaults to `nomic-embed-text`
- `prompt`: the text

Default baseUrl:

- `process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434'`

Important nuance:

- In Dockerized environments, `host.docker.internal` is used so the container can reach the host’s Ollama.

### Input truncation

To avoid exceeding model context limits:

- truncates at `maxLength = 32000` characters

### Dimension guardrails

- `nomic-embed-text` → expects 768 dims
- `all-minilm` → expects 384 dims

The default model is **nomic-embed-text**, and the unified layer expects **768**.

### Failure handling

The Ollama provider throws `OllamaEmbeddingError` for:

- empty text
- non-2xx HTTP responses
- invalid JSON response
- dimension mismatch
- timeout (`AbortError`)
- network errors / Ollama not running (suggests `ollama serve`)

Also note:

- `isOllamaAvailable(baseUrl?)` checks `GET /api/tags` and verifies `nomic-embed-text` exists.

---

## OpenAI provider details (paid fallback)

### Endpoint + payload

File:

- `apps/web/lib/embeddings/openai.ts`

It calls:

- `POST https://api.openai.com/v1/embeddings`

Headers:

- `Authorization: Bearer ${apiKey}`

Request body:

- `model`: defaults to `text-embedding-3-large`
- `input`: text (or list of texts for batch)
- `dimensions`: **768** (only for `text-embedding-3-*` models)

Critical design choice:

- `text-embedding-3-large` normally returns 3072 dims, but the code requests `dimensions = 768` so it matches pgvector schema.

### Failure handling

The OpenAI provider throws `OpenAIEmbeddingError` for:

- missing API key
- empty text
- non-2xx responses (attempts to parse error message)
- invalid response format
- timeout
- network failure

Availability check:

- `isOpenAIAvailable(apiKey?)` hits `GET https://api.openai.com/v1/models` with a 2s timeout.

---

## The unified fallback behavior (what actually happens)

File:

- `apps/web/lib/embeddings/index.ts`

Default behavior:

1. Try Ollama (`generateOllamaEmbedding`).
2. If Ollama fails:
   - in dev, logs a warning
3. Try OpenAI (`generateOpenAIEmbedding`).
4. If both fail:
   - throw `EmbeddingServiceError` with both error messages.

This is the key “senior” framing:

- “We prefer local embeddings for cost and privacy, but we keep a paid fallback to avoid total outages. Regardless of provider we enforce dimension consistency.”

---

## How to test the embedding pipeline (repo-native)

There are built-in scripts:

- `apps/web/lib/embeddings/test-ollama.ts`
  - tests Ollama availability and one embedding
- `apps/web/lib/embeddings/test-unified.ts`
  - tests provider detection + `generateEmbedding()`

These scripts also document expected operator actions:

- start Ollama: `ollama serve`
- pull model: `ollama pull nomic-embed-text`
- set OpenAI key for fallback: `OPENAI_API_KEY=...`

---

## Failure modes (what can break, and what it looks like)

- **Ollama down**
  - error: `Ollama service is not running. Start it with: ollama serve`
  - unified service will fallback to OpenAI if configured

- **OpenAI not configured**
  - error: `OpenAI API key is required...`
  - unified service will fail if Ollama also fails

- **Dimension mismatch**
  - error: `Expected 768 dimensions ... got ...`
  - this is critical because pgvector column is fixed-size

- **Timeouts**
  - both providers have AbortController-based timeouts

- **Docker networking mismatch**
  - baseUrl defaults to `host.docker.internal` which assumes Ollama is on the host
  - if you move Ollama into a different container/network, you must update `OLLAMA_BASE_URL`

---

## Exercises (do later)

### Exercise A: Explain provider selection in 6 lines

Write an interview answer that includes:

- which provider is preferred and why
- what the fallback is
- how dimension consistency is enforced

### Exercise B: Find where embeddings are used

Search for `generateEmbedding(` and list the top callsites.

---

## Completion checklist

- [ ] I can explain how Ollama embeddings are generated (endpoint + payload).
- [ ] I can explain how OpenAI embeddings are generated (dimensions override).
- [ ] I can explain why the system standardizes on 768 dims.
- [ ] I can list 3 realistic failure modes and their symptoms.
