import type { IssueOptionSets } from '@/lib/types/issues';
import { prisma } from '@/lib/prisma';

const CACHE_TTL_MS = 1000 * 60; // 1 minute
let cachedOptions: IssueOptionSets | null = null;
let lastLoadedAt = 0;

export function clearIssueOptionCache() {
  cachedOptions = null;
  lastLoadedAt = 0;
}

function ensureOptionsShape(options: IssueOptionSets) {
  if (!options.statuses.length) {
    throw new Error('Issue status options not configured');
  }
  if (!options.priorities.length) {
    throw new Error('Issue priority options not configured');
  }
}

export async function getIssueOptionSets(force = false): Promise<IssueOptionSets> {
  const now = Date.now();
  if (!force && cachedOptions && now - lastLoadedAt < CACHE_TTL_MS) {
    return cachedOptions;
  }

  const [statuses, priorities, modules] = await Promise.all([
    prisma.issueStatusOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.issuePriorityOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.issueModuleOption.findMany({ orderBy: { order: 'asc' } }),
  ]);

  cachedOptions = {
    statuses: statuses.map((s) => ({ value: s.value, label: s.label })),
    priorities: priorities.map((p) => ({ value: p.value, label: p.label })),
    modules: modules.map((m) => ({ value: m.value, label: m.label })),
  };
  lastLoadedAt = now;

  ensureOptionsShape(cachedOptions);
  return cachedOptions;
}

export async function resolveStatusValue(input?: string) {
  const options = await getIssueOptionSets();
  if (input) {
    const match = options.statuses.find((option) => option.value === input);
    if (!match) {
      throw new Error(`Invalid status value: ${input}`);
    }
    return match.value;
  }
  const defaultStatus = options.statuses[0];
  if (!defaultStatus) {
    throw new Error('No default status available');
  }
  return defaultStatus.value;
}

export async function resolvePriorityValue(input?: string) {
  const options = await getIssueOptionSets();
  if (input) {
    const match = options.priorities.find((option) => option.value === input);
    if (!match) {
      throw new Error(`Invalid priority value: ${input}`);
    }
    return match.value;
  }
  const defaultPriority = options.priorities[0];
  if (!defaultPriority) {
    throw new Error('No default priority available');
  }
  return defaultPriority.value;
}

export async function resolveModuleValue(input?: string) {
  if (!input) {
    return undefined;
  }
  const options = await getIssueOptionSets();
  const match = options.modules.find((option) => option.value === input);
  if (!match) {
    throw new Error(`Invalid module value: ${input}`);
  }
  return match.value;
}
