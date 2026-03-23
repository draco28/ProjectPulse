import type { IssueAutoTagConfig } from '@/lib/types/issues';
import type { IssueFileContextInput } from '@/lib/validations/issue';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Issues:Tagging' });

let cachedConfig: IssueAutoTagConfig | null = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 1000 * 60; // 1 minute
const SETTING_KEY = 'issues.rules';

export function clearAutoTagCache() {
  cachedConfig = null;
  lastConfigFetch = 0;
}

function isIssueAutoTagConfig(value: unknown): value is IssueAutoTagConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.rules)) {
    return false;
  }
  return candidate.rules.every((rule) => typeof rule.pattern === 'string');
}

export async function getAutoTagConfig(force = false): Promise<IssueAutoTagConfig | null> {
  const now = Date.now();
  if (!force && cachedConfig && now - lastConfigFetch < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) {
    cachedConfig = null;
    return null;
  }

  if (!isIssueAutoTagConfig(setting.value)) {
    log.warn({ settingKey: SETTING_KEY }, 'Setting has invalid structure, skipping auto-tagging');
    cachedConfig = null;
    return null;
  }

  cachedConfig = setting.value;
  lastConfigFetch = now;
  return cachedConfig;
}

export interface AutoTagResult {
  module?: string;
  labels: string[];
  priority?: string;
}

export async function deriveAutoTags(files?: IssueFileContextInput[]): Promise<AutoTagResult> {
  if (!files || files.length === 0) {
    return { labels: [] };
  }

  const config = await getAutoTagConfig();
  if (!config) {
    return { labels: [] };
  }

  const labels = new Set<string>();
  let issueModule = config.defaultModule;
  let priority = config.defaultPriority;

  for (const file of files) {
    if (!file?.filePath) continue;

    for (const rule of config.rules) {
      try {
        const regex = new RegExp(rule.pattern);
        if (regex.test(file.filePath)) {
          if (rule.labels) {
            rule.labels.forEach((label) => labels.add(label));
          }
          if (rule.module) {
            issueModule = rule.module;
          }
          if (rule.priority) {
            priority = rule.priority;
          }
        }
      } catch (error) {
        log.warn(
          { error: error instanceof Error ? error.message : String(error), pattern: rule.pattern },
          'Invalid auto-tag regex'
        );
      }
    }
  }

  return {
    module: issueModule,
    priority,
    labels: Array.from(labels),
  };
}
