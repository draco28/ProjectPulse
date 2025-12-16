# Git Integration - Foundation Layer

## Overview

Git Integration is the **foundation layer** that enables CodeGuard to access repository files for scanning. Without this, there's no code to analyze.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GITHUB                                          │
│                                                                              │
│  User's repositories (private/public)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
          │                              │
          │ GitHub App                   │ Webhooks
          │ (Installation + OAuth)       │ (push events)
          ↓                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROJECTPULSE (Mac mini)                                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ GitHub App      │  │ Repo Manager    │  │ Webhook Handler             │  │
│  │                 │  │                 │  │                             │  │
│  │ • OAuth flow    │  │ • Shallow clone │  │ • Verify signature          │  │
│  │ • Install flow  │  │ • Fetch/pull    │  │ • Trigger scans             │  │
│  │ • Token mgmt    │  │ • Cleanup       │  │ • Update repo state         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                              ↓                                               │
│                    /var/repos/{installationId}/{repoName}                    │
│                    (Shallow clones, <50GB budget)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Why GitHub App (Not OAuth App)?

| Feature | GitHub App | OAuth App |
|---------|------------|-----------|
| Webhooks | Built-in | Manual setup |
| Permissions | Fine-grained | Broad scopes |
| Rate limits | Higher (5000/hr/installation) | Lower (5000/hr/user) |
| Installation flow | "Install" button | OAuth redirect |
| Access tokens | Short-lived, auto-refresh | Long-lived |
| Industry standard | Yes (SonarCloud, Snyk) | Legacy |

## Components

### 1. GitHub App Configuration

**Permissions Required:**
- `contents: read` - Read repo files
- `metadata: read` - Repo metadata

**Webhook Events:**
- `push` - Trigger scan on code push
- `installation` - Track app installs/uninstalls

**Webhook URL:** `https://your-domain.com/api/github/webhook`

### 2. Database Models

```prisma
model GitHubInstallation {
  id              String    @id @default(cuid())
  installationId  Int       @unique  // GitHub's installation ID
  accountLogin    String               // GitHub username/org
  accountType     String               // 'User' or 'Organization'
  accessToken     String?              // Encrypted, short-lived
  tokenExpiresAt  DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  repositories    Repository[]
}

model Repository {
  id              String    @id @default(cuid())
  projectId       Int
  project         Project   @relation(fields: [projectId], references: [id])
  installationId  String
  installation    GitHubInstallation @relation(fields: [installationId], references: [id])

  githubId        Int       @unique    // GitHub's repo ID
  fullName        String               // owner/repo
  defaultBranch   String    @default("main")
  clonePath       String?              // /var/repos/...
  lastClonedAt    DateTime?
  lastCommitSha   String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  scans           CodeScan[]
}
```

### 3. Clone Service

**Location:** `apps/web/lib/git/clone.ts`

**Features:**
- Shallow clone (`git clone --depth 1`)
- Clone to `/var/repos/{installationId}/{repoName}`
- GitHub App token authentication
- Fetch/pull for updates
- Error handling (network, permissions, disk space)

**Example:**
```typescript
async function cloneRepository(
  installation: GitHubInstallation,
  repo: { fullName: string, defaultBranch: string }
): Promise<string> {
  const token = await getInstallationToken(installation.installationId);
  const clonePath = `/var/repos/${installation.id}/${repo.fullName.replace('/', '-')}`;

  await execAsync(`git clone --depth 1 https://x-access-token:${token}@github.com/${repo.fullName}.git ${clonePath}`);

  return clonePath;
}
```

### 4. Webhook Handler

**Location:** `apps/web/app/api/github/webhook/route.ts`

**Security:**
- Verify webhook signature using `GITHUB_WEBHOOK_SECRET`
- Reject invalid signatures

**Events Handled:**
- `push` → Update repo + trigger scan
- `installation.created` → Store installation
- `installation.deleted` → Clean up installation
- `installation_repositories.added` → Add repos
- `installation_repositories.removed` → Remove repos

### 5. Cleanup Service

**Location:** `apps/web/lib/git/cleanup.ts`

**Policy (for <50GB budget):**
- Delete repos not scanned in 7 days
- Delete oldest repos when approaching 45GB
- Run daily via cron job

**Example:**
```typescript
async function cleanupOldRepos(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const staleRepos = await prisma.repository.findMany({
    where: {
      OR: [
        { lastClonedAt: { lt: sevenDaysAgo } },
        { lastClonedAt: null }
      ],
      clonePath: { not: null }
    }
  });

  for (const repo of staleRepos) {
    await fs.rm(repo.clonePath!, { recursive: true, force: true });
    await prisma.repository.update({
      where: { id: repo.id },
      data: { clonePath: null }
    });
  }
}
```

## API Routes

### `GET /api/github/install`
Redirect to GitHub App installation page.

### `GET /api/github/callback`
Handle OAuth callback after installation.

### `POST /api/github/webhook`
Receive webhook events from GitHub.

## UI Components

### Project Settings → GitHub Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Integration                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: Not Connected                                           │
│                                                                  │
│  [Connect GitHub]                                                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Connected Repositories:                                         │
│  (Connect GitHub to see your repositories)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

After connection:

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Integration                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: Connected as @draco                                     │
│                                                                  │
│  [Manage Installation] [Disconnect]                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Connected Repositories:                                         │
│                                                                  │
│  ☑ draco/my-project          Last scan: 2h ago    [Scan Now]   │
│  ☑ draco/another-repo        Last scan: 1d ago    [Scan Now]   │
│  ☐ draco/not-connected       -                    [Connect]     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

```bash
# GitHub App credentials
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_CLIENT_ID=Iv1.abc123
GITHUB_CLIENT_SECRET=secret123
GITHUB_WEBHOOK_SECRET=webhook_secret_123

# Storage
REPO_STORAGE_PATH=/var/repos
REPO_STORAGE_LIMIT_GB=50
```

## Implementation Timeline

### Week 1: GitHub App Setup

| Day | Task |
|-----|------|
| 1 | Create GitHub App in Developer Settings |
| 2 | Configure permissions, webhook URL |
| 2 | Generate private key, store securely |
| 3 | Add database models (GitHubInstallation, Repository) |
| 4 | Create and run migration |
| 5 | Implement OAuth flow endpoints |

### Week 2: Repository Management

| Day | Task |
|-----|------|
| 1 | Implement clone service with shallow clone |
| 2 | Add authentication (GitHub App token) |
| 3 | Implement webhook handler with signature verification |
| 4 | Handle push, installation events |
| 5 | Implement cleanup service with cron job |

## Success Criteria

- [ ] GitHub App configured and approved
- [ ] User can install app via "Connect GitHub" button
- [ ] Installation creates GitHubInstallation record
- [ ] Repos are cloned to /var/repos on connection
- [ ] Webhooks trigger on push events
- [ ] Cleanup keeps storage under 50GB
- [ ] Security: Webhook signatures verified, tokens encrypted
