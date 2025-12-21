/**
 * Ollama Embeddings Client
 *
 * Provides embedding generation using local Ollama instance.
 * Default Model: nomic-embed-text (768 dimensions) - best open-source embedding model
 * Alternative: all-minilm (384 dimensions) - faster but less accurate
 * API: http://localhost:11434/api/embeddings
 *
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings
 */

export interface OllamaEmbeddingOptions {
  model?: 'nomic-embed-text' | 'all-minilm' | string;
  baseUrl?: string;
  timeout?: number; // milliseconds
  expectedDimensions?: number; // Override dimension validation
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class OllamaEmbeddingError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'OllamaEmbeddingError';
  }
}

/**
 * Generate embeddings using Ollama
 *
 * @param text - Text to embed (max ~8192 tokens for nomic-embed-text)
 * @param options - Configuration options
 * @returns 768-dimensional embedding vector (nomic-embed-text) or 384-dimensional (all-minilm)
 * @throws OllamaEmbeddingError if generation fails
 *
 * @example
 * ```typescript
 * // Default: nomic-embed-text (768 dimensions)
 * const embedding = await generateOllamaEmbedding('PostgreSQL indexing');
 * console.log(embedding.length); // 768
 *
 * // Alternative: all-minilm (384 dimensions, faster)
 * const embedding2 = await generateOllamaEmbedding('PostgreSQL indexing', { model: 'all-minilm' });
 * console.log(embedding2.length); // 384
 * ```
 */
export async function generateOllamaEmbedding(
  text: string,
  options: OllamaEmbeddingOptions = {}
): Promise<number[]> {
  const {
    model = 'nomic-embed-text',
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434',
    timeout = 10000, // 10 second default timeout
    expectedDimensions,
  } = options;

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new OllamaEmbeddingError('Text cannot be empty');
  }

  // Truncate if too long (nomic-embed-text max context: 8192 tokens ≈ 32000 chars)
  const maxLength = 32000;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  // Determine expected dimensions based on model
  const dims = expectedDimensions ?? (model === 'all-minilm' ? 384 : 768);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: truncatedText,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new OllamaEmbeddingError(
        `Ollama API returned ${response.status}: ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as OllamaEmbeddingResponse;

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new OllamaEmbeddingError('Invalid response format from Ollama API');
    }

    // Verify dimensions
    if (data.embedding.length !== dims) {
      throw new OllamaEmbeddingError(
        `Expected ${dims} dimensions for model ${model}, got ${data.embedding.length}`
      );
    }

    return data.embedding;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof OllamaEmbeddingError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle timeout
      if (error.name === 'AbortError') {
        throw new OllamaEmbeddingError(`Ollama API timeout after ${timeout}ms`, undefined, error);
      }

      // Handle network errors
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new OllamaEmbeddingError(
          'Ollama service is not running. Start it with: ollama serve',
          undefined,
          error
        );
      }

      throw new OllamaEmbeddingError(
        `Ollama embedding generation failed: ${error.message}`,
        undefined,
        error
      );
    }

    throw new OllamaEmbeddingError('Unknown error during embedding generation');
  }
}

/**
 * Batch generate embeddings for multiple texts
 *
 * Processes texts sequentially to avoid overwhelming Ollama.
 * For large batches, consider rate limiting.
 *
 * @param texts - Array of texts to embed
 * @param options - Configuration options
 * @returns Array of 384-dimensional embedding vectors
 * @throws OllamaEmbeddingError if any generation fails
 *
 * @example
 * ```typescript
 * const embeddings = await generateOllamaBatchEmbeddings([
 *   'PostgreSQL indexing',
 *   'Next.js Server Components'
 * ]);
 * console.log(embeddings.length); // 2
 * console.log(embeddings[0].length); // 768
 * ```
 */
export async function generateOllamaBatchEmbeddings(
  texts: string[],
  options: OllamaEmbeddingOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateOllamaEmbedding(text, options);
    embeddings.push(embedding);

    // Small delay between requests to avoid overwhelming Ollama
    if (texts.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/**
 * Check if Ollama service is available
 *
 * @param baseUrl - Ollama base URL
 * @returns true if Ollama is running and model is available
 *
 * @example
 * ```typescript
 * if (await isOllamaAvailable()) {
 *   console.log('Ollama is ready');
 * }
 * ```
 */
export async function isOllamaAvailable(baseUrl = 'http://localhost:11434'): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Check if nomic-embed-text model is available (default)
    return data.models?.some((m: { name: string }) => m.name.includes('nomic-embed-text')) ?? false;
  } catch {
    return false;
  }
}
