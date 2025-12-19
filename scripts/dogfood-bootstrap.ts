#!/usr/bin/env npx tsx
/**
 * Dogfood Bootstrap Script
 *
 * Sets up ProjectPulse to manage its own development by calling production APIs.
 *
 * Usage:
 *   # With password (script handles login)
 *   PROD_PASSWORD=xxx pnpm dogfood:bootstrap
 *
 *   # With session token (copy from browser cookies)
 *   PROD_SESSION_TOKEN=xxx pnpm dogfood:bootstrap
 *
 *   # Dry run
 *   pnpm dogfood:bootstrap --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Production API endpoints
  PROD_API_BASE: 'https://projectpulse.dracodev.dev',

  // Target user (must exist in prod DB)
  USER_EMAIL: 'dracogamer2897@gmail.com',

  // Project to create
  PROJECT_NAME: 'ProjectPulse-Internal',
  PROJECT_DESCRIPTION: 'Self-managed project for ProjectPulse development',
  PROJECT_REPO: 'https://github.com/your-org/projectpulse', // Update this

  // Essential docs to import (relative to project root)
  // Wiki categories: 'getting-started', 'guides', 'reference', 'troubleshooting', 'api-reference'
  DOCS_TO_IMPORT: [
    { path: 'docs/01-PRD.md', title: 'Product Requirements Document', category: 'reference' },
    { path: 'docs/02-SRS.md', title: 'Software Requirements Specification', category: 'reference' },
    { path: 'docs/03-Architecture.md', title: 'System Architecture', category: 'reference' },
    { path: 'docs/04-Data-and-Model-Spec.md', title: 'Data Model Specification', category: 'reference' },
    { path: 'docs/12-Backlog.md', title: 'Product Backlog', category: 'guides' },
    { path: 'docs/13-Project-Plan.md', title: 'Project Plan', category: 'guides' },
  ],
};

// =============================================================================
// TYPES
// =============================================================================

interface BootstrapState {
  sessionCookie: string | null;
  projectId: number | null;
  projectTokenId: number | null;
  projectToken: string | null;
  session1Complete: boolean;
  session2Complete: boolean;
  session3Complete: boolean;
  wikiPagesCreated: number;
}

// =============================================================================
// HELPERS
// =============================================================================

const state: BootstrapState = {
  sessionCookie: null,
  projectId: null,
  projectTokenId: null,
  projectToken: null,
  session1Complete: false,
  session2Complete: false,
  session3Complete: false,
  wikiPagesCreated: 0,
};

const isDryRun = process.argv.includes('--dry-run');

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function logStep(step: number, message: string) {
  console.log(`\n[${'='.repeat(60)}]`);
  console.log(`[Step ${step}] ${message}`);
  console.log(`[${'='.repeat(60)}]\n`);
}

async function apiCall<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH';
    body?: Record<string, unknown>;
    useProjectToken?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, useProjectToken = false } = options;

  const url = `${CONFIG.PROD_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use project token (bearer) or session cookie
  if (useProjectToken && state.projectToken) {
    headers['Authorization'] = `Bearer ${state.projectToken}`;
  } else if (state.sessionCookie) {
    headers['Cookie'] = state.sessionCookie;
  }

  if (isDryRun) {
    log('🔍', `[DRY RUN] ${method} ${endpoint}`);
    if (body) log('📦', `Body: ${JSON.stringify(body, null, 2).slice(0, 200)}...`);
    return {} as T;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

function readDocFile(docPath: string): string {
  const fullPath = path.join(process.cwd(), docPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Document not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// =============================================================================
// STEP 1: AUTHENTICATE
// =============================================================================

async function authenticate(): Promise<void> {
  logStep(1, 'Authenticating with Production');

  // Dry run mode - skip actual auth
  if (isDryRun) {
    log('🔍', '[DRY RUN] Skipping authentication');
    state.sessionCookie = 'mock-session-cookie-dry-run';
    return;
  }

  // Option 1: Session token provided directly
  const sessionToken = process.env.PROD_SESSION_TOKEN;
  if (sessionToken) {
    log('🔑', 'Using provided session token');
    state.sessionCookie = `next-auth.session-token=${sessionToken}`;
    return;
  }

  // Option 2: Password provided, perform login
  const password = process.env.PROD_PASSWORD;
  if (password) {
    log('🔐', `Logging in as ${CONFIG.USER_EMAIL}...`);

    if (isDryRun) {
      log('🔍', '[DRY RUN] Would login via NextAuth');
      state.sessionCookie = 'mock-session-cookie';
      return;
    }

    // Step 1: Get CSRF token AND cookies from the same request
    const csrfResponse = await fetch(`${CONFIG.PROD_API_BASE}/api/auth/csrf`);
    const csrfData = (await csrfResponse.json()) as { csrfToken: string };
    const csrfToken = csrfData.csrfToken;

    // Extract cookies from CSRF response (needed for login)
    const csrfCookies = csrfResponse.headers.get('set-cookie') || '';
    log('🔑', `Got CSRF token: ${csrfToken.slice(0, 20)}...`);

    // Step 2: Perform credentials login with CSRF cookies
    const loginResponse = await fetch(
      `${CONFIG.PROD_API_BASE}/api/auth/callback/credentials`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Pass the cookies from CSRF request
          Cookie: csrfCookies
            .split(',')
            .map((c) => c.split(';')[0].trim())
            .join('; '),
        },
        body: new URLSearchParams({
          email: CONFIG.USER_EMAIL,
          password: password,
          csrfToken: csrfToken,
          callbackUrl: CONFIG.PROD_API_BASE,
        }),
        redirect: 'manual', // Don't follow redirects, we need the cookies
      }
    );

    // Check if login was successful (should redirect to callback URL, not signin)
    const location = loginResponse.headers.get('location') || '';
    if (location.includes('signin') || location.includes('error')) {
      throw new Error(
        `Login failed: Invalid credentials or CSRF error. Redirect: ${location}`
      );
    }

    // Extract ALL cookies from login response
    const loginCookies = loginResponse.headers.get('set-cookie') || '';
    log('🍪', `Login response cookies: ${loginCookies.slice(0, 100)}...`);

    // Look for session token in various NextAuth cookie names
    const sessionPatterns = [
      /next-auth\.session-token=([^;,\s]+)/,
      /__Secure-next-auth\.session-token=([^;,\s]+)/,
      /authjs\.session-token=([^;,\s]+)/,
    ];

    let sessionToken: string | null = null;
    for (const pattern of sessionPatterns) {
      const match = loginCookies.match(pattern);
      if (match) {
        sessionToken = match[1];
        break;
      }
    }

    // If no session token in login response, we need to follow the redirect
    if (!sessionToken) {
      log('🔄', 'Following redirect to get session cookie...');

      // Combine cookies from both requests
      const allCookies = [csrfCookies, loginCookies]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((c) => c.split(';')[0].trim())
        .filter(Boolean)
        .join('; ');

      // Follow the redirect
      const redirectResponse = await fetch(location.startsWith('http') ? location : `${CONFIG.PROD_API_BASE}${location}`, {
        headers: {
          Cookie: allCookies,
        },
        redirect: 'manual',
      });

      const redirectCookies = redirectResponse.headers.get('set-cookie') || '';
      for (const pattern of sessionPatterns) {
        const match = redirectCookies.match(pattern);
        if (match) {
          sessionToken = match[1];
          break;
        }
      }
    }

    if (!sessionToken) {
      log('⚠️', 'Could not extract session token from login flow.');
      log('💡', 'Please use PROD_SESSION_TOKEN instead:');
      log('   ', '1. Login to https://projectpulse.dracodev.dev');
      log('   ', '2. Open DevTools → Application → Cookies');
      log('   ', '3. Copy the value of next-auth.session-token or __Secure-next-auth.session-token');
      log('   ', '4. Run: PROD_SESSION_TOKEN=<token> pnpm dogfood:bootstrap');
      throw new Error('Login failed: Could not extract session token. Use PROD_SESSION_TOKEN instead.');
    }

    state.sessionCookie = `__Secure-next-auth.session-token=${sessionToken}; next-auth.session-token=${sessionToken}`;
    log('✅', 'Login successful!');
    return;
  }

  // No auth method provided
  throw new Error(
    'Authentication required. Set PROD_PASSWORD or PROD_SESSION_TOKEN environment variable.'
  );
}

// =============================================================================
// STEP 2: CREATE PROJECT
// =============================================================================

async function createProject(): Promise<void> {
  logStep(2, 'Creating Project');

  log('📁', `Creating project: ${CONFIG.PROJECT_NAME}`);

  if (isDryRun) {
    state.projectId = 999; // Mock ID for dry run
    log('✅', `[DRY RUN] Project would be created`);
    return;
  }

  try {
    const result = await apiCall<{ project: { id: number; name: string } }>('/api/projects', {
      method: 'POST',
      body: {
        name: CONFIG.PROJECT_NAME,
        description: CONFIG.PROJECT_DESCRIPTION,
        repository: CONFIG.PROJECT_REPO,
      },
    });

    state.projectId = result.project.id;
    log('✅', `Project created with ID: ${state.projectId}`);
  } catch (error) {
    // Check if project already exists (409 Conflict)
    if (error instanceof Error && error.message.includes('409')) {
      log('⚠️', 'Project already exists, fetching existing project...');

      // Fetch existing projects to find the one with our name
      const projectsResult = await apiCall<{
        projects: Array<{ id: number; name: string }>;
      }>('/api/projects', { method: 'GET' });

      const existingProject = projectsResult.projects.find(
        (p) => p.name === CONFIG.PROJECT_NAME
      );

      if (existingProject) {
        state.projectId = existingProject.id;
        log('✅', `Using existing project with ID: ${state.projectId}`);
        return;
      }
    }
    throw error;
  }
}

// =============================================================================
// STEP 3: CREATE PROJECT TOKEN
// =============================================================================

async function createProjectToken(): Promise<void> {
  logStep(3, 'Creating Project Token for API Access');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  log('🔑', 'Generating project token...');

  if (isDryRun) {
    state.projectToken = 'mock-project-token';
    state.projectTokenId = 1;
    log('✅', '[DRY RUN] Project token would be created');
    return;
  }

  try {
    // API returns: { token: string, id: number, name: string, expiresAt: Date }
    const result = await apiCall<{
      token: string;
      id: number;
      name: string;
      expiresAt: string;
    }>(`/api/projects/${state.projectId}/tokens`, {
      method: 'POST',
      body: {
        name: 'dogfood-bootstrap-token',
        expiresInDays: 90, // 90 days for dogfooding
      },
    });

    state.projectToken = result.token;
    state.projectTokenId = result.id;
    log('✅', `Project token created (ID: ${state.projectTokenId})`);
    log('🔐', `Token: ${state.projectToken.slice(0, 20)}...`);
  } catch (error) {
    // Token with same name already exists - that's fine, we'll use session auth
    if (error instanceof Error && error.message.includes('409')) {
      log('⚠️', 'Token already exists, continuing with session auth...');
      log('💡', 'To regenerate token, revoke the existing one first.');
      return;
    }
    throw error;
  }
}

// =============================================================================
// STEP 4: FAST-TRACK SESSION 1 (10 phases with minimal answers)
// =============================================================================

async function fastTrackSession1(): Promise<void> {
  logStep(4, 'Fast-Tracking Session 1 (10 phases)');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  for (let phase = 1; phase <= 10; phase++) {
    log('📝', `Submitting Phase ${phase}/10...`);

    await apiCall('/api/onboarding/answers', {
      method: 'POST',
      body: {
        projectId: state.projectId,
        phase,
        answers: {
          [`q${phase}-1-1`]: `ProjectPulse self-managed project - Phase ${phase} auto-filled`,
        },
      },
      useProjectToken: true,
    });
  }

  state.session1Complete = true;
  log('✅', 'Session 1 complete (all 10 phases submitted)');
}

// =============================================================================
// STEP 5: SESSION 2 - Store Project Plan Document
// =============================================================================

async function storeProjectPlan(): Promise<void> {
  logStep(5, 'Session 2: Storing 13-Project-Plan.md');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  // Read the project plan
  const projectPlanPath = 'docs/13-Project-Plan.md';
  log('📄', `Reading ${projectPlanPath}...`);

  let content: string;
  try {
    content = readDocFile(projectPlanPath);
  } catch {
    log('⚠️', 'Project plan not found, using placeholder');
    content = `# Project Plan\n\n## Phase 1: Foundation\n### Sprint 1: Setup\n- Monday: Environment setup\n- Tuesday: Core infrastructure\n`;
  }

  // API limit is 50,000 characters - truncate if needed
  const MAX_CHARS = 49000; // Leave some buffer
  if (content.length > MAX_CHARS) {
    log('⚠️', `Document too large (${content.length} chars), truncating to ${MAX_CHARS}...`);
    content = content.slice(0, MAX_CHARS) + '\n\n[Truncated for API limits - see full doc in /docs/13-Project-Plan.md]';
  }

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  log('📊', `Document size: ${wordCount} words, ${content.length} chars`);

  await apiCall('/api/onboarding/documents', {
    method: 'POST',
    body: {
      projectId: state.projectId,
      filename: '13-Project-Plan.md',
      content,
      category: 'planning',
      wordCount,
      overwrite: true,
    },
    useProjectToken: true,
  });

  state.session2Complete = true;
  log('✅', 'Session 2: Project plan stored');
}

// =============================================================================
// STEP 6: SESSION 3 - Create Persona & Sync
// =============================================================================

async function createPersonaAndSync(): Promise<void> {
  logStep(6, 'Session 3: Creating Persona & Syncing');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  // Create one persona via batch API
  log('🤖', 'Creating DevHub Agent persona...');

  await apiCall('/api/batch/agent-personas', {
    method: 'POST',
    body: {
      projectId: state.projectId,
      personas: [
        {
          name: 'DevHub Agent',
          slug: 'devhub-agent',
          description: 'Internal development agent for ProjectPulse dogfooding',
          systemPrompt: `You are DevHub Agent, the internal development assistant for ProjectPulse.
Your role is to help manage ProjectPulse development using ProjectPulse itself.

Key responsibilities:
- Create and manage tickets for bugs, features, and tasks
- Track development progress via the roadmap
- Search and update wiki documentation
- Assist with code reviews and testing

Always use ProjectPulse MCP tools for task management.`,
          skills: ['code', 'tickets', 'docs', 'testing'],
          tools: ['ticket_create', 'ticket_search', 'wiki_search', 'wiki_create'],
          rules: ['Always use tickets for tracking work', 'Update wiki when patterns change'],
          expertise: ['Next.js', 'React', 'Prisma', 'TypeScript', 'MCP'],
          personality: 'Professional, efficient, detail-oriented',
          isActive: true,
          isBuiltIn: false,
        },
      ],
    },
    useProjectToken: true,
  });

  log('✅', 'Persona created');

  // Sync Session 3 to mark it complete
  log('🔄', 'Syncing Session 3...');

  await apiCall('/api/onboarding/sync-session3', {
    method: 'POST',
    body: {
      projectId: state.projectId,
    },
    useProjectToken: true,
  });

  state.session3Complete = true;
  log('✅', 'Session 3 synced and marked complete');
}

// =============================================================================
// STEP 7: IMPORT ESSENTIAL DOCS TO WIKI
// =============================================================================

async function importDocsToWiki(): Promise<void> {
  logStep(7, 'Importing Essential Docs to Wiki');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  const MAX_WIKI_CHARS = 49000; // Wiki API limit is 50K

  for (const doc of CONFIG.DOCS_TO_IMPORT) {
    log('📄', `Importing: ${doc.title}`);

    let content: string;
    try {
      content = readDocFile(doc.path);
    } catch {
      log('⚠️', `Skipping ${doc.path} (file not found)`);
      continue;
    }

    // Truncate if too large
    if (content.length > MAX_WIKI_CHARS) {
      log('⚠️', `Truncating ${doc.path} (${content.length} chars → ${MAX_WIKI_CHARS})`);
      content = content.slice(0, MAX_WIKI_CHARS) + '\n\n[Truncated - see full doc in repository]';
    }

    const slug = slugify(doc.title);

    try {
      await apiCall('/api/wiki', {
        method: 'POST',
        body: {
          projectId: state.projectId,
          title: doc.title,
          path: slug,
          content,
          category: doc.category,
          excerpt: `Imported from ${doc.path}`,
        },
        useProjectToken: true,
      });

      state.wikiPagesCreated++;
      log('✅', `Wiki page created: /${slug}`);
    } catch (error) {
      // 409 = already exists, which is fine
      if (error instanceof Error && error.message.includes('409')) {
        log('⏭️', `Wiki page already exists: /${slug}`);
      } else {
        log('❌', `Failed to import ${doc.path}: ${error}`);
      }
    }
  }

  log('✅', `Imported ${state.wikiPagesCreated} wiki pages`);
}

// =============================================================================
// STEP 8: REFRESH WIKI TEMPLATES
// =============================================================================

async function refreshWikiTemplates(): Promise<void> {
  logStep(8, 'Refreshing Wiki Templates from Latest Code');

  if (!state.projectId) {
    throw new Error('Project ID not set');
  }

  log('🔄', 'Checking for template updates...');

  if (isDryRun) {
    log('✅', '[DRY RUN] Would refresh wiki templates');
    return;
  }

  try {
    // First preview what would change
    const preview = await apiCall<{
      updated: Array<{ title: string; reason: string }>;
      skipped: Array<{ title: string; reason: string }>;
      unchanged: Array<{ title: string }>;
    }>(`/api/projects/${state.projectId}/wiki/refresh?preview=true`, {
      method: 'POST',
    });

    if (preview.updated.length === 0) {
      log('✅', `Wiki templates already up-to-date (${preview.unchanged.length} pages)`);
      return;
    }

    // Apply updates
    log('📝', `Updating ${preview.updated.length} wiki templates...`);
    for (const page of preview.updated) {
      log('  📄', `${page.title}: ${page.reason}`);
    }

    const result = await apiCall<{
      updated: Array<{ title: string }>;
    }>(`/api/projects/${state.projectId}/wiki/refresh`, {
      method: 'POST',
    });

    log('✅', `Refreshed ${result.updated.length} wiki templates`);
  } catch (error) {
    // Non-fatal - log and continue
    log('⚠️', `Wiki refresh failed: ${error}`);
    log('💡', 'Templates may have stale content - manually refresh if needed');
  }
}

// =============================================================================
// STEP 9: PRINT SUMMARY
// =============================================================================

function printSummary(): void {
  logStep(9, 'Bootstrap Complete!');

  console.log(`
${'='.repeat(60)}
                    DOGFOOD BOOTSTRAP SUMMARY
${'='.repeat(60)}

Project: ${CONFIG.PROJECT_NAME}
Owner: ${CONFIG.USER_EMAIL}
Project ID: ${state.projectId}
${isDryRun ? '⚠️  DRY RUN - No actual changes made' : ''}

Onboarding Status:
  ✅ Session 1: Complete (10 phases)
  ${state.session2Complete ? '✅' : '❌'} Session 2: ${state.session2Complete ? 'Complete' : 'Failed'} (13-Project-Plan.md)
  ${state.session3Complete ? '✅' : '❌'} Session 3: ${state.session3Complete ? 'Complete' : 'Failed'} (1 persona)

Wiki Pages: ${state.wikiPagesCreated} imported

${'='.repeat(60)}
                      NEXT STEPS
${'='.repeat(60)}

1. View your project:
   ${CONFIG.PROD_API_BASE}/projects/${state.projectId}

2. Create tickets via MCP:
   projectpulse_ticket_create {
     projectId: ${state.projectId},
     title: "Your ticket title",
     kind: "feature" | "bug" | "task"
   }

3. Search tickets:
   projectpulse_ticket_search { projectId: ${state.projectId} }

4. View roadmap:
   ${CONFIG.PROD_API_BASE}/projects/${state.projectId}/roadmap

5. Search wiki:
   projectpulse_wikiSearch { projectId: ${state.projectId}, query: "..." }

${state.projectToken ? `
Project Token (save this for MCP access):
${state.projectToken}
` : ''}
${'='.repeat(60)}
`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         PROJECTPULSE DOGFOOD BOOTSTRAP SCRIPT                 ║
║                                                               ║
║  Setting up ProjectPulse to manage its own development        ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  if (isDryRun) {
    log('🔍', 'DRY RUN MODE - No changes will be made\n');
  }

  try {
    await authenticate();
    await createProject();
    await createProjectToken();
    await fastTrackSession1();
    await storeProjectPlan();
    await createPersonaAndSync();
    await importDocsToWiki();
    await refreshWikiTemplates();
    printSummary();

    log('🎉', 'Dogfood bootstrap complete! You can now use ProjectPulse to manage ProjectPulse.');
  } catch (error) {
    console.error('\n❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

main();
