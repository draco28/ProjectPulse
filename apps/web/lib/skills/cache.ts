/**
 * Skills LRU Cache
 *
 * Sprint 6 - Phase 4: Skills Advanced Features
 * US-094: Auto-unload skills after 5 minutes
 * Created: 2025-11-13
 *
 * In-memory LRU (Least Recently Used) cache for loaded skills.
 * Automatically evicts entries after TTL expires or when cache is full.
 *
 * **Features**:
 * - 5-minute TTL per entry (auto-unload)
 * - 100 entry capacity (LRU eviction when full)
 * - Automatic cleanup of expired entries every 1 minute
 * - Thread-safe singleton pattern
 *
 * **Migration Path**:
 * - Phase 1: In-memory Map-based cache (current)
 * - Phase 2: Redis cache for multi-instance deployments (future)
 *
 * @see /lib/skills/constants.ts - CACHE_CONFIG for configuration
 */

import { CACHE_CONFIG } from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp (ms)
  accessCount: number;
  lastAccessedAt: number; // Unix timestamp (ms)
}

interface CacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number; // Percentage (0-100)
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * Generic LRU Cache with TTL support
 *
 * Uses JavaScript Map for O(1) get/set operations.
 * Maintains insertion order for LRU eviction.
 *
 * **Usage**:
 * ```typescript
 * const cache = new LRUCache<string>(100, 300000); // 100 entries, 5-min TTL
 * cache.set('key', 'value');
 * const value = cache.get('key'); // Returns 'value' or undefined
 * ```
 *
 * @template T - Type of cached values
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private capacity: number;
  private ttl: number; // milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Stats
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(capacity: number = 100, ttl: number = 300000) {
    this.cache = new Map();
    this.capacity = capacity;
    this.ttl = ttl;

    // Start automatic cleanup
    this.startCleanup();

    console.log(`[LRUCache] Initialized with capacity=${capacity}, ttl=${ttl}ms`);
  }

  /**
   * Get value from cache
   *
   * Returns undefined if:
   * - Key not found
   * - Entry expired
   *
   * Updates access time and count on successful hit.
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = now;

    // Move to end (most recently used) by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   *
   * Evicts least recently used entry if cache is full.
   * Overwrites existing key if present.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param customTtl - Optional custom TTL (ms) for this entry
   */
  set(key: string, value: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.ttl;

    // If cache is full and key is new, evict LRU entry
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Delete existing key (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessedAt: now,
    });
  }

  /**
   * Check if key exists (and not expired)
   *
   * @param key - Cache key
   * @returns true if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   *
   * @param key - Cache key
   * @returns true if key was deleted, false if not found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    console.log('[LRUCache] Cache cleared');
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats (size, hits, misses, hit rate, etc.)
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: Number(hitRate.toFixed(2)),
    };
  }

  /**
   * Evict least recently used entry
   *
   * @private
   */
  private evictLRU(): void {
    // First entry is the least recently used (Map maintains insertion order)
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.evictions++;
      console.log(`[LRUCache] Evicted LRU entry: ${firstKey}`);
    }
  }

  /**
   * Remove expired entries
   *
   * @private
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[LRUCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Start automatic cleanup interval
   *
   * @private
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, CACHE_CONFIG.CLEANUP_INTERVAL_MS);

    // Ensure cleanup stops when process exits
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.stopCleanup());
    }
  }

  /**
   * Stop automatic cleanup interval
   *
   * @private
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[LRUCache] Cleanup stopped');
    }
  }
}

// ============================================================================
// SINGLETON SKILLS CACHE
// ============================================================================

/**
 * Skill type for cache (full skill object from database)
 */
export interface CachedSkill {
  id: number;
  projectId: number;
  slug: string;
  title: string;
  content: string;
  category: string;
  description: string | null;
  tags: string[];
  frameworks: string[];
  usageCount: number;
  lastLoadedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Singleton skills cache instance
 *
 * Cache key format: `${projectId}:${slug}` (ensures multi-tenancy isolation)
 *
 * **Usage**:
 * ```typescript
 * import { skillsCache } from '@/lib/skills/cache';
 *
 * // Get skill from cache
 * const skill = skillsCache.get(1, 'nextjs-ssr');
 *
 * // Set skill in cache
 * skillsCache.set(1, 'nextjs-ssr', skillData);
 *
 * // Check if cached
 * if (skillsCache.has(1, 'nextjs-ssr')) {
 *   // ...
 * }
 * ```
 */
export class SkillsCache {
  private cache: LRUCache<CachedSkill>;

  constructor() {
    this.cache = new LRUCache<CachedSkill>(
      CACHE_CONFIG.MAX_ENTRIES,
      CACHE_CONFIG.TTL_MS
    );

    console.log(
      `[SkillsCache] Initialized singleton (TTL: ${CACHE_CONFIG.TTL_SECONDS}s, max: ${CACHE_CONFIG.MAX_ENTRIES} entries)`
    );
  }

  /**
   * Generate cache key from projectId and slug
   *
   * Format: `${projectId}:${slug}`
   * Ensures multi-tenancy isolation (different projects can have same slug)
   *
   * @private
   */
  private getCacheKey(projectId: number, slug: string): string {
    return `${projectId}:${slug}`;
  }

  /**
   * Get skill from cache
   *
   * @param projectId - Project ID
   * @param slug - Skill slug
   * @returns Cached skill or undefined
   */
  get(projectId: number, slug: string): CachedSkill | undefined {
    const key = this.getCacheKey(projectId, slug);
    return this.cache.get(key);
  }

  /**
   * Set skill in cache
   *
   * @param projectId - Project ID
   * @param slug - Skill slug
   * @param skill - Skill data
   */
  set(projectId: number, slug: string, skill: CachedSkill): void {
    const key = this.getCacheKey(projectId, slug);
    this.cache.set(key, skill);
    console.log(`[SkillsCache] Cached skill: ${key}`);
  }

  /**
   * Check if skill is cached
   *
   * @param projectId - Project ID
   * @param slug - Skill slug
   * @returns true if cached and not expired
   */
  has(projectId: number, slug: string): boolean {
    const key = this.getCacheKey(projectId, slug);
    return this.cache.has(key);
  }

  /**
   * Invalidate (delete) skill from cache
   *
   * Used when skill is updated or deleted.
   *
   * @param projectId - Project ID
   * @param slug - Skill slug
   * @returns true if deleted
   */
  invalidate(projectId: number, slug: string): boolean {
    const key = this.getCacheKey(projectId, slug);
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[SkillsCache] Invalidated skill: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cached skills
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats (size, hits, misses, hit rate, etc.)
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }
}

/**
 * Singleton instance of skills cache
 *
 * Import and use directly:
 * ```typescript
 * import { skillsCache } from '@/lib/skills/cache';
 * const skill = skillsCache.get(projectId, slug);
 * ```
 */
export const skillsCache = new SkillsCache();
