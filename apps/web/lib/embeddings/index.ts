/**
 * Unified Embedding Service
 *
 * Automatically selects the best available embedding provider:
 * 1. Ollama (nomic-embed-text) - Free, local, 768 dimensions
 * 2. OpenAI (text-embedding-3-large) - Paid fallback, 768 dimensions
 *
 * Provides consistent 768-dimensional embeddings regardless of provider.
 */

import {
  generateOllamaEmbedding,
  generateOllamaBatchEmbeddings,
  isOllamaAvailable,
  OllamaEmbeddingError,
} from './ollama';

import {
  generateOpenAIEmbedding,
  generateOpenAIBatchEmbeddings,
  isOpenAIAvailable,
  OpenAIEmbeddingError,
} from './openai';

import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Embedding' });

// =============================================================================
// Retry Logic for Ollama Cold Start (Ticket #56)
// =============================================================================
// When Ollama is idle, the first request often fails with EOF/500 error.
// Retrying after 2-3 seconds typically succeeds once Ollama "wakes up".

const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 2000, // Start with 2s delay (Ollama needs ~2-3s to wake)
  maxDelayMs: 5000, // Cap at 5s
};

/**
 * Generic retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (error: unknown) => boolean,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < config.maxRetries && isRetryable(error)) {
        const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs);
        log.info({ attempt: attempt + 1, maxRetries: config.maxRetries, delayMs: delay }, 'Retrying after delay');
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Detect Ollama cold start errors (EOF, connection reset, 500 status)
 */
function isOllamaColdStartError(error: unknown): boolean {
  if (error instanceof OllamaEmbeddingError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('eof') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      error.statusCode === 500
    );
  }
  return false;
}

export type EmbeddingProvider = 'ollama' | 'openai' | 'auto';

export interface EmbeddingServiceOptions {
  provider?: EmbeddingProvider;
  ollamaBaseUrl?: string;
  openaiApiKey?: string;
  timeout?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  provider: 'ollama' | 'openai';
  duration: number; // milliseconds
}

export class EmbeddingServiceError extends Error {
  constructor(
    message: string,
    public provider?: 'ollama' | 'openai',
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'EmbeddingServiceError';
  }
}

/**
 * Generate embeddings with automatic provider selection
 *
 * Strategy:
 * - 'auto': Try Ollama first (free), fallback to OpenAI if unavailable
 * - 'ollama': Use Ollama only, fail if unavailable
 * - 'openai': Use OpenAI only, fail if API key missing
 *
 * @param text - Text to embed (max ~8000 tokens)
 * @param options - Configuration options
 * @returns 768-dimensional embedding vector with metadata
 * @throws EmbeddingServiceError if generation fails
 *
 * @example
 * ```typescript
 * // Automatic provider selection
 * const result = await generateEmbedding('PostgreSQL indexing');
 * console.log(result.embedding.length); // 768
 * console.log(result.provider); // 'ollama' or 'openai'
 * console.log(result.duration); // milliseconds
 *
 * // Force specific provider
 * const result2 = await generateEmbedding('PostgreSQL indexing', { provider: 'ollama' });
 * ```
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingServiceOptions = {}
): Promise<EmbeddingResult> {
  const { provider = 'auto', ollamaBaseUrl, openaiApiKey, timeout = 10000 } = options;

  const startTime = Date.now();

  // Force Ollama (with retry for cold start)
  if (provider === 'ollama') {
    try {
      const embedding = await withRetry(
        () => generateOllamaEmbedding(text, { baseUrl: ollamaBaseUrl, timeout }),
        isOllamaColdStartError
      );
      return {
        embedding,
        provider: 'ollama',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new EmbeddingServiceError(
        `Ollama embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ollama',
        error
      );
    }
  }

  // Force OpenAI
  if (provider === 'openai') {
    try {
      const embedding = await generateOpenAIEmbedding(text, {
        apiKey: openaiApiKey,
        timeout,
      });
      return {
        embedding,
        provider: 'openai',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new EmbeddingServiceError(
        `OpenAI embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai',
        error
      );
    }
  }

  // Auto: Try Ollama first (with retry for cold start), fallback to OpenAI
  try {
    const embedding = await withRetry(
      () => generateOllamaEmbedding(text, { baseUrl: ollamaBaseUrl, timeout }),
      isOllamaColdStartError
    );
    return {
      embedding,
      provider: 'ollama',
      duration: Date.now() - startTime,
    };
  } catch (ollamaError) {
    // Log Ollama failure for debugging
    log.warn(
      { error: ollamaError instanceof Error ? ollamaError.message : 'Unknown error' },
      'Ollama failed, trying OpenAI fallback'
    );

    // Try OpenAI fallback
    try {
      const embedding = await generateOpenAIEmbedding(text, {
        apiKey: openaiApiKey,
        timeout,
      });
      return {
        embedding,
        provider: 'openai',
        duration: Date.now() - startTime,
      };
    } catch (openaiError) {
      // Both providers failed
      throw new EmbeddingServiceError(
        `All embedding providers failed. Ollama: ${ollamaError instanceof Error ? ollamaError.message : 'Unknown'}. OpenAI: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`,
        undefined,
        { ollamaError, openaiError }
      );
    }
  }
}

/**
 * Batch generate embeddings with automatic provider selection
 *
 * @param texts - Array of texts to embed
 * @param options - Configuration options
 * @returns Array of 768-dimensional embedding vectors with metadata
 * @throws EmbeddingServiceError if generation fails
 *
 * @example
 * ```typescript
 * const results = await generateBatchEmbeddings([
 *   'PostgreSQL indexing',
 *   'Next.js Server Components'
 * ]);
 * console.log(results.embeddings.length); // 2
 * console.log(results.embeddings[0].length); // 768
 * console.log(results.provider); // 'ollama' or 'openai'
 * ```
 */
export async function generateBatchEmbeddings(
  texts: string[],
  options: EmbeddingServiceOptions = {}
): Promise<{
  embeddings: number[][];
  provider: 'ollama' | 'openai';
  duration: number;
}> {
  if (texts.length === 0) {
    return { embeddings: [], provider: 'ollama', duration: 0 };
  }

  const { provider = 'auto', ollamaBaseUrl, openaiApiKey, timeout = 30000 } = options;

  const startTime = Date.now();

  // Force Ollama (with retry for cold start)
  if (provider === 'ollama') {
    try {
      const embeddings = await withRetry(
        () => generateOllamaBatchEmbeddings(texts, { baseUrl: ollamaBaseUrl, timeout }),
        isOllamaColdStartError
      );
      return {
        embeddings,
        provider: 'ollama',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new EmbeddingServiceError(
        `Ollama batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ollama',
        error
      );
    }
  }

  // Force OpenAI
  if (provider === 'openai') {
    try {
      const embeddings = await generateOpenAIBatchEmbeddings(texts, {
        apiKey: openaiApiKey,
        timeout,
      });
      return {
        embeddings,
        provider: 'openai',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new EmbeddingServiceError(
        `OpenAI batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai',
        error
      );
    }
  }

  // Auto: Try Ollama first (with retry for cold start), fallback to OpenAI
  try {
    const embeddings = await withRetry(
      () => generateOllamaBatchEmbeddings(texts, { baseUrl: ollamaBaseUrl, timeout }),
      isOllamaColdStartError
    );
    return {
      embeddings,
      provider: 'ollama',
      duration: Date.now() - startTime,
    };
  } catch (ollamaError) {
    // Log Ollama failure for debugging
    log.warn(
      { error: ollamaError instanceof Error ? ollamaError.message : 'Unknown error' },
      'Ollama batch failed, trying OpenAI fallback'
    );

    // Try OpenAI fallback
    try {
      const embeddings = await generateOpenAIBatchEmbeddings(texts, {
        apiKey: openaiApiKey,
        timeout,
      });
      return {
        embeddings,
        provider: 'openai',
        duration: Date.now() - startTime,
      };
    } catch (openaiError) {
      // Both providers failed
      throw new EmbeddingServiceError(
        `All embedding providers failed for batch. Ollama: ${ollamaError instanceof Error ? ollamaError.message : 'Unknown'}. OpenAI: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`,
        undefined,
        { ollamaError, openaiError }
      );
    }
  }
}

/**
 * Check which embedding providers are available
 *
 * @param options - Configuration options
 * @returns Object indicating availability of each provider
 *
 * @example
 * ```typescript
 * const status = await checkEmbeddingProviders();
 * if (status.ollama) {
 *   console.log('Ollama is available (free)');
 * }
 * if (status.openai) {
 *   console.log('OpenAI is available (paid fallback)');
 * }
 * ```
 */
export async function checkEmbeddingProviders(options: EmbeddingServiceOptions = {}): Promise<{
  ollama: boolean;
  openai: boolean;
  recommended: 'ollama' | 'openai' | 'none';
}> {
  const { ollamaBaseUrl, openaiApiKey } = options;

  const [ollamaAvailable, openaiAvailable] = await Promise.all([
    isOllamaAvailable(ollamaBaseUrl),
    isOpenAIAvailable(openaiApiKey),
  ]);

  let recommended: 'ollama' | 'openai' | 'none' = 'none';
  if (ollamaAvailable) {
    recommended = 'ollama'; // Prefer free local option
  } else if (openaiAvailable) {
    recommended = 'openai'; // Fallback to paid option
  }

  return {
    ollama: ollamaAvailable,
    openai: openaiAvailable,
    recommended,
  };
}

// Re-export individual provider functions for advanced usage
export {
  generateOllamaEmbedding,
  generateOllamaBatchEmbeddings,
  isOllamaAvailable,
  OllamaEmbeddingError,
} from './ollama';

export {
  generateOpenAIEmbedding,
  generateOpenAIBatchEmbeddings,
  isOpenAIAvailable,
  OpenAIEmbeddingError,
} from './openai';
