import type { IssueOptionSets } from '@/lib/types/issues';
import { prisma } from '@/lib/prisma';
import { TICKET_STATUSES } from '@/lib/constants/status';

/**
 * Custom error for option validation failures
 * Allows API routes to catch and return 400 instead of 500
 */
export class OptionValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly field: string;
  readonly invalidValue: string;
  readonly validValues: string[];

  constructor(field: string, invalidValue: string, validValues: string[]) {
    const validList = validValues.slice(0, 10).join(', ');
    const message = `Invalid ${field} value: "${invalidValue}". Valid values are: ${validList}`;
    super(message);
    this.name = 'OptionValidationError';
    this.field = field;
    this.invalidValue = invalidValue;
    this.validValues = validValues;
  }
}

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
    prisma.ticketStatusOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.ticketPriorityOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.ticketModuleOption.findMany({ orderBy: { order: 'asc' } }),
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

// Sprint 15: Backwards compatibility mapping for legacy status values
const STATUS_BACKWARDS_COMPAT: Record<string, string> = {
  open: TICKET_STATUSES.BACKLOG,
  closed: TICKET_STATUSES.DONE,
  resolved: TICKET_STATUSES.DONE,
  blocked: TICKET_STATUSES.BACKLOG,
};

export async function resolveStatusValue(input?: string) {
  const options = await getIssueOptionSets();
  if (input) {
    // Normalize input: convert underscores to hyphens for backwards compatibility
    let normalizedInput = input.replace(/_/g, '-');

    // Sprint 15: Map legacy status values to new kanban statuses
    const mappedStatus = STATUS_BACKWARDS_COMPAT[normalizedInput];
    if (mappedStatus) {
      normalizedInput = mappedStatus;
    }

    const match = options.statuses.find(
      (option) => option.value === normalizedInput || option.value === input
    );
    if (!match) {
      throw new OptionValidationError(
        'status',
        input,
        options.statuses.map((s) => s.value)
      );
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
      throw new OptionValidationError(
        'priority',
        input,
        options.priorities.map((p) => p.value)
      );
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
    throw new OptionValidationError(
      'module',
      input,
      options.modules.map((m) => m.value)
    );
  }
  return match.value;
}
