'use client';

/**
 * Settings Client Component (Sprint 15: Redesigned to match project theme)
 *
 * Interactive UI for managing agent tokens and project settings.
 * Uses neumorphic design system: neu-raised, icon-coral, rounded-3xl
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  ArrowLeft,
  Settings,
  Key,
  Tag,
} from 'lucide-react';
import { LabelManagement, type Label } from '@/components/projects/settings/LabelManagement';

interface Token {
  id: number;
  name: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isRevoked: boolean;
}

interface Project {
  id: number;
  name: string;
  mcpWriteFiles: boolean;
  repository: string | null;
}

interface SettingsClientProps {
  project: Project;
  tokens: Token[];
  labels: Label[];
  mcpEndpoint: string;
}

interface WikiRefreshResult {
  updated: Array<{ title: string; path: string; reason: string }>;
  skipped: Array<{ title: string; path: string; reason: string }>;
  unchanged: Array<{ title: string; path: string }>;
  preview: boolean;
}

export function SettingsClient({ project, tokens, labels, mcpEndpoint }: SettingsClientProps) {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<{
    token: string;
    name: string;
    expiresAt: Date;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [mcpWriteFiles, setMcpWriteFiles] = useState(project.mcpWriteFiles);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Wiki refresh state
  const [wikiRefreshPreview, setWikiRefreshPreview] = useState<WikiRefreshResult | null>(null);
  const [isRefreshingWikis, setIsRefreshingWikis] = useState(false);
  const [showWikiRefreshModal, setShowWikiRefreshModal] = useState(false);

  const handleGenerateToken = async () => {
    if (!tokenName.trim()) {
      alert('Please enter a token name');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tokenName.trim(),
          expiresInDays: expiryDays,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate token');
      }

      const result = await response.json();
      setGeneratedToken(result);
      setShowGenerateModal(false);
      setTokenName('');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = async (tokenId: number, tokenName: string) => {
    if (
      !confirm(
        `Are you sure you want to revoke the token "${tokenName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/tokens/${tokenId}/revoke`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke token');
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcpWriteFiles }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      router.refresh();
      alert('Settings saved successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Wiki refresh handlers
  const handlePreviewWikiRefresh = async () => {
    setIsRefreshingWikis(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/wiki/refresh?preview=true`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to preview wiki refresh');
      }

      const result = await response.json();
      setWikiRefreshPreview(result);
      setShowWikiRefreshModal(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefreshingWikis(false);
    }
  };

  const handleConfirmWikiRefresh = async () => {
    setIsRefreshingWikis(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/wiki/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh wikis');
      }

      const result = await response.json();
      setShowWikiRefreshModal(false);
      setWikiRefreshPreview(null);
      alert(
        `Wiki refresh complete! ${result.updated.length} pages updated, ${result.skipped.length} skipped, ${result.unchanged.length} unchanged.`
      );
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefreshingWikis(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert('Copied to clipboard!'))
        .catch(() => fallbackCopyToClipboard(text));
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please copy manually: ' + text);
    }
    document.body.removeChild(textArea);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeTokens = tokens.filter((t) => !t.isRevoked);
  const revokedTokens = tokens.filter((t) => t.isRevoked);

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Link */}
      <Link
        href={`/dashboard?project=${project.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Project Settings</h1>
          <p className="text-sm text-slate">{project.name}</p>
        </div>
      </div>

      {/* Agent Tokens Section */}
      <section className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Agent Tokens</h2>
              <p className="text-sm text-slate">Manage bearer tokens for agent MCP access</p>
            </div>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="coral-gradient smooth-transition flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg hover:opacity-90"
          >
            <Plus size={18} />
            Generate New Token
          </button>
        </div>

        {/* Active Tokens Table */}
        {activeTokens.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-slate">Active Tokens</h3>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate">Expires</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate">Last Used</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTokens.map((token) => (
                    <tr
                      key={token.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-white">{token.name}</td>
                      <td className="px-4 py-3 text-sm text-slate">{formatDate(token.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-slate">
                        {token.expiresAt ? formatDate(token.expiresAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate">{formatDate(token.lastUsedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRevokeToken(token.id, token.name)}
                          className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                          title="Revoke token"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTokens.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center text-slate">
            No active tokens. Generate one to get started.
          </div>
        )}

        {/* Revoked Tokens (Collapsed) */}
        {revokedTokens.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate hover:text-white">
              Show {revokedTokens.length} revoked token{revokedTokens.length !== 1 ? 's' : ''}
            </summary>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate">Created</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revokedTokens.map((token) => (
                    <tr key={token.id} className="border-b border-white/5 opacity-60">
                      <td className="px-4 py-2 text-sm text-slate line-through">{token.name}</td>
                      <td className="px-4 py-2 text-sm text-slate">{formatDate(token.createdAt)}</td>
                      <td className="px-4 py-2 text-sm text-red-400">Revoked</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      {/* Project Controls Section */}
      <section className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Project Controls</h2>
        </div>

        {/* mcpWriteFiles Toggle */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 font-medium text-white">Allow MCP to Write Helper Files</h3>
              <p className="text-sm text-slate">
                When enabled, agents can write <code className="text-accent-primary">CLAUDE.md</code>{' '}
                and <code className="text-accent-primary">AGENTS.md</code> files to your repository
                during onboarding and bootstrap.
              </p>
            </div>
            <label className="flex cursor-pointer items-center">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={mcpWriteFiles}
                  onChange={(e) => setMcpWriteFiles(e.target.checked)}
                />
                <div
                  className={`block h-8 w-14 rounded-full transition-colors ${
                    mcpWriteFiles ? 'coral-gradient' : 'bg-white/20'
                  }`}
                />
                <div
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    mcpWriteFiles ? 'translate-x-6' : ''
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* MCP Endpoint Display */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-slate">MCP Endpoint</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              {mcpEndpoint}
            </code>
            <button
              onClick={() => copyToClipboard(mcpEndpoint)}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate transition-colors hover:bg-white/10 hover:text-white"
              title="Copy endpoint"
            >
              <Copy size={18} />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate">
            Use this URL when configuring your agent&apos;s MCP connection.
          </p>
        </div>

        {/* Save Button */}
        {project.mcpWriteFiles !== mcpWriteFiles && (
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="coral-gradient smooth-transition rounded-xl px-6 py-2.5 font-medium text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </section>

      {/* Wiki Templates Section */}
      <section className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Wiki Templates</h2>
            <p className="text-sm text-slate">Update default wiki pages with latest templates</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-200">
            <strong>What this does:</strong> Updates system-generated wiki pages (Getting Started,
            MCP Configuration, etc.) with the latest templates. Pages you&apos;ve edited won&apos;t
            be overwritten.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreviewWikiRefresh}
            disabled={isRefreshingWikis}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshingWikis ? 'animate-spin' : ''} />
            Preview Changes
          </button>
          <button
            onClick={handleConfirmWikiRefresh}
            disabled={isRefreshingWikis}
            className="coral-gradient smooth-transition flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh Now
          </button>
        </div>
      </section>

      {/* Labels Section */}
      <section className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <Tag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Labels</h2>
            <p className="text-sm text-slate">Create and manage labels for organizing tickets</p>
          </div>
        </div>
        <LabelManagement projectId={project.id} labels={labels} />
      </section>

      {/* Agent Configuration Section */}
      <section className="neu-raised smooth-transition rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Agent Configuration</h2>
        </div>

        <p className="mb-6 text-sm text-slate">
          Configure your AI agent to connect to ProjectPulse. First, generate a token above, then
          add the configuration below.
        </p>

        {/* Claude Code Configuration */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium text-white">Claude Code</h3>
          <p className="mb-2 text-sm text-slate">
            Edit <code className="text-accent-primary">~/.claude/settings.json</code>:
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate">
              <code>{`{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}`}</code>
            </pre>
            <button
              onClick={() =>
                copyToClipboard(`{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}`)
              }
              className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/10 p-2 text-slate transition-colors hover:bg-white/20 hover:text-white"
              title="Copy config"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Windsurf Configuration */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium text-white">Windsurf</h3>
          <p className="mb-2 text-sm text-slate">
            Edit <code className="text-accent-primary">~/.codeium/windsurf/mcp_config.json</code>:
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate">
              <code>{`{
  "mcpServers": {
    "projectpulse": {
      "serverUrl": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}`}</code>
            </pre>
            <button
              onClick={() =>
                copyToClipboard(`{
  "mcpServers": {
    "projectpulse": {
      "serverUrl": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}`)
              }
              className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/10 p-2 text-slate transition-colors hover:bg-white/20 hover:text-white"
              title="Copy config"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Cursor Configuration */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium text-white">Cursor</h3>
          <p className="mb-2 text-sm text-slate">
            Go to <strong>Settings → MCP → Add Server</strong> with:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-slate">
            <li>
              <strong className="text-white">Name:</strong> projectpulse
            </li>
            <li>
              <strong className="text-white">Type:</strong> HTTP
            </li>
            <li>
              <strong className="text-white">URL:</strong>{' '}
              <code className="text-accent-primary">{mcpEndpoint}</code>
            </li>
            <li>
              <strong className="text-white">Headers:</strong>{' '}
              <code className="text-accent-primary">Authorization: Bearer &lt;YOUR_TOKEN&gt;</code>
            </li>
          </ul>
        </div>

        {/* Test Connection */}
        <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <h4 className="mb-2 font-medium text-blue-300">Test Your Connection</h4>
          <p className="text-sm text-blue-200/80">
            After configuring, ask your agent: &quot;Use the{' '}
            <code className="text-blue-300">projectpulse_health_check</code> tool&quot;
          </p>
          <p className="mt-1 text-sm text-blue-200/80">
            Expected response:{' '}
            <code className="text-blue-300">{'status: healthy, database: connected'}</code>
          </p>
        </div>

        {/* Security Warning */}
        <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-yellow-500" />
          <p className="text-sm text-yellow-200">
            <strong>Security Note:</strong> Store your token securely. It grants full project access
            to the agent. Revoke tokens immediately if compromised.
          </p>
        </div>
      </section>

      {/* Generate Token Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="neu-raised w-full max-w-md rounded-3xl p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Generate New Token</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g., Frontend Claude"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-slate">Choose a descriptive name (unique per project)</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate">Expires In</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleGenerateToken}
                  disabled={isGenerating || !tokenName.trim()}
                  className="coral-gradient smooth-transition flex-1 rounded-xl px-4 py-3 font-medium text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Token'}
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setTokenName('');
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Token Display Modal */}
      {generatedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="neu-raised w-full max-w-2xl rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                <CheckCircle2 size={24} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Token Generated Successfully</h3>
            </div>

            <div className="mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="mb-1 text-sm font-medium text-yellow-200">
                ⚠️ Important: Copy this token now
              </p>
              <p className="text-sm text-yellow-200/80">
                You will not be able to see this token again. Store it securely.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate">Token Name</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                {generatedToken.name}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate">Token (Bearer)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-green-400">
                  {generatedToken.token}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedToken.token)}
                  className="coral-gradient flex-shrink-0 rounded-xl p-3 text-white shadow-lg transition-opacity hover:opacity-90"
                  title="Copy token"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate">Expires</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                {formatDate(generatedToken.expiresAt)}
              </div>
            </div>

            <button
              onClick={() => setGeneratedToken(null)}
              className="coral-gradient smooth-transition w-full rounded-xl px-4 py-3 font-medium text-white shadow-lg hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Wiki Refresh Preview Modal */}
      {showWikiRefreshModal && wikiRefreshPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="neu-raised max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Wiki Refresh Preview</h3>

            <p className="mb-4 text-sm text-slate">
              Review the changes that will be made to your wiki pages:
            </p>

            {/* Updated Pages */}
            {wikiRefreshPreview.updated.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckCircle2 size={16} />
                  Will be Updated ({wikiRefreshPreview.updated.length})
                </h4>
                <ul className="space-y-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-3">
                  {wikiRefreshPreview.updated.map((page, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-green-300">{page.title}</span>
                      <span className="block text-xs text-slate">{page.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skipped Pages */}
            {wikiRefreshPreview.skipped.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-400">
                  <AlertTriangle size={16} />
                  Will be Skipped ({wikiRefreshPreview.skipped.length})
                </h4>
                <ul className="space-y-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                  {wikiRefreshPreview.skipped.map((page, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-yellow-300">{page.title}</span>
                      <span className="block text-xs text-slate">{page.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unchanged Pages */}
            {wikiRefreshPreview.unchanged.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-slate">
                  Already Up-to-Date ({wikiRefreshPreview.unchanged.length})
                </h4>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate">
                    {wikiRefreshPreview.unchanged.map((p) => p.title).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* No Changes Message */}
            {wikiRefreshPreview.updated.length === 0 &&
              wikiRefreshPreview.skipped.length === 0 &&
              wikiRefreshPreview.unchanged.length === 0 && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate">No wiki pages found to refresh.</p>
                </div>
              )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowWikiRefreshModal(false);
                  setWikiRefreshPreview(null);
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              {wikiRefreshPreview.updated.length > 0 && (
                <button
                  onClick={handleConfirmWikiRefresh}
                  disabled={isRefreshingWikis}
                  className="coral-gradient smooth-transition flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshingWikis ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Apply {wikiRefreshPreview.updated.length} Update
                      {wikiRefreshPreview.updated.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
