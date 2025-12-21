/**
 * OpenAI Embeddings Client
 *
 * Provides embedding generation using OpenAI's API as a fallback.
 * Model: text-embedding-3-large with dimension reduction to 768
 * Cost: ~$0.13 per 1M tokens (very affordable)
 *
 * @see https://platform.openai.com/docs/guides/embeddings
 */

export interface OpenAIEmbeddingOptions {
  apiKey?: string;
  model?: 'text-embedding-3-large' | 'text-embedding-3-small' | 'text-embedding-ada-002';
  dimensions?: number; // For text-embedding-3-* models
  timeout?: number;
}

export interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIEmbeddingError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'OpenAIEmbeddingError';
  }
}

/**
 * Generate embeddings using OpenAI
 *
 * @param text - Text to embed (max ~8191 tokens)
 * @param options - Configuration options
 * @returns 768-dimensional embedding vector
 * @throws OpenAIEmbeddingError if generation fails
 *
 * @example
 * ```typescript
 * const embedding = await generateOpenAIEmbedding(
 *   'PostgreSQL indexing',
 *   { apiKey: process.env.OPENAI_API_KEY }
 * );
 * console.log(embedding.length); // 768
 * ```
 */
export async function generateOpenAIEmbedding(
  text: string,
  options: OpenAIEmbeddingOptions = {}
): Promise<number[]> {
  const {
    apiKey = process.env.OPENAI_API_KEY,
    model = 'text-embedding-3-large',
    dimensions = 768, // Reduce from 3072 to match nomic-embed-text
    timeout = 10000,
  } = options;

  // Validate API key
  if (!apiKey) {
    throw new OpenAIEmbeddingError(
      'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey option.'
    );
  }

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new OpenAIEmbeddingError('Text cannot be empty');
  }

  // Truncate if too long (OpenAI max: 8191 tokens ≈ 32000 chars)
  const maxLength = 32000;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestBody: Record<string, unknown> = {
      model,
      input: truncatedText,
    };

    // Only add dimensions for text-embedding-3-* models
    if (model.startsWith('text-embedding-3-')) {
      requestBody.dimensions = dimensions;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } }).error?.message || response.statusText;
      throw new OpenAIEmbeddingError(
        `OpenAI API returned ${response.status}: ${errorMessage}`,
        response.status
      );
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;

    if (
      !data.data ||
      data.data.length === 0 ||
      !data.data[0] ||
      !Array.isArray(data.data[0].embedding)
    ) {
      throw new OpenAIEmbeddingError('Invalid response format from OpenAI API');
    }

    const embedding = data.data[0].embedding;

    // Verify dimensions
    const expectedDims = model === 'text-embedding-ada-002' ? 1536 : dimensions || 768;
    if (embedding.length !== expectedDims) {
      throw new OpenAIEmbeddingError(
        `Expected ${expectedDims} dimensions for model ${model}, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof OpenAIEmbeddingError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle timeout
      if (error.name === 'AbortError') {
        throw new OpenAIEmbeddingError(`OpenAI API timeout after ${timeout}ms`, undefined, error);
      }

      // Handle network errors
      if (error.message.includes('fetch failed')) {
        throw new OpenAIEmbeddingError(
          'Failed to connect to OpenAI API. Check your internet connection.',
          undefined,
          error
        );
      }

      throw new OpenAIEmbeddingError(
        `OpenAI embedding generation failed: ${error.message}`,
        undefined,
        error
      );
    }

    throw new OpenAIEmbeddingError('Unknown error during embedding generation');
  }
}

/**
 * Batch generate embeddings for multiple texts
 *
 * OpenAI API supports up to 2048 inputs per request for efficiency.
 *
 * @param texts - Array of texts to embed
 * @param options - Configuration options
 * @returns Array of 768-dimensional embedding vectors
 * @throws OpenAIEmbeddingError if any generation fails
 *
 * @example
 * ```typescript
 * const embeddings = await generateOpenAIBatchEmbeddings(
 *   ['PostgreSQL indexing', 'Next.js Server Components'],
 *   { apiKey: process.env.OPENAI_API_KEY }
 * );
 * console.log(embeddings.length); // 2
 * console.log(embeddings[0].length); // 768
 * ```
 */
export async function generateOpenAIBatchEmbeddings(
  texts: string[],
  options: OpenAIEmbeddingOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const {
    apiKey = process.env.OPENAI_API_KEY,
    model = 'text-embedding-3-large',
    dimensions = 768,
    timeout = 30000, // Longer timeout for batch
  } = options;

  // Validate API key
  if (!apiKey) {
    throw new OpenAIEmbeddingError(
      'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey option.'
    );
  }

  // OpenAI supports up to 2048 inputs per request
  const batchSize = 2048;
  const batches: string[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestBody: Record<string, unknown> = {
        model,
        input: batch,
      };

      // Only add dimensions for text-embedding-3-* models
      if (model.startsWith('text-embedding-3-')) {
        requestBody.dimensions = dimensions;
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message || response.statusText;
        throw new OpenAIEmbeddingError(
          `OpenAI API returned ${response.status}: ${errorMessage}`,
          response.status
        );
      }

      const data = (await response.json()) as OpenAIEmbeddingResponse;

      // Sort by index to maintain order
      const embeddings = data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);

      allEmbeddings.push(...embeddings);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  return allEmbeddings;
}

/**
 * Check if OpenAI API is available
 *
 * @param apiKey - OpenAI API key
 * @returns true if API is accessible
 *
 * @example
 * ```typescript
 * if (await isOpenAIAvailable(process.env.OPENAI_API_KEY)) {
 *   console.log('OpenAI is ready');
 * }
 * ```
 */
export async function isOpenAIAvailable(apiKey?: string): Promise<boolean> {
  try {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      return false;
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    return response.ok;
  } catch {
    return false;
  }
}
