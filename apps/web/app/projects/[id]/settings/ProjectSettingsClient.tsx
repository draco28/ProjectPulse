'use client';

/**
 * Project Settings Client Component (Sprint 9)
 *
 * Interactive UI for managing agent tokens and project settings.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Plus, Trash2, AlertTriangle, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
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

interface ProjectSettingsClientProps {
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

export function ProjectSettingsClient({
  project,
  tokens,
  labels,
  mcpEndpoint,
}: ProjectSettingsClientProps) {
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
    } catch (error: any) {
      alert(error.message);
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
    } catch (error: any) {
      alert(error.message);
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
    } catch (error: any) {
      alert(error.message);
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
    } catch (error: any) {
      alert(error.message);
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
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsRefreshingWikis(false);
    }
  };

  const copyToClipboard = (text: string) => {
    // Fallback for HTTP contexts where navigator.clipboard is unavailable
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert('Copied to clipboard!');
        })
        .catch(() => {
          fallbackCopyToClipboard(text);
        });
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
    <div className="min-h-screen bg-[#0f0f1a] p-8 text-white">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-coral-400 mb-2 text-3xl font-bold">Project Settings</h1>
        <p className="text-gray-400">{project.name}</p>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Agent Tokens Section */}
        <section className="shadow-neumorphic rounded-lg bg-[#1a1a2e] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-coral-400 mb-1 text-xl font-semibold">Agent Tokens</h2>
              <p className="text-sm text-gray-400">Manage bearer tokens for agent MCP access</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-coral-500 hover:bg-coral-600 flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors"
            >
              <Plus size={18} />
              Generate New Token
            </button>
          </div>

          {/* Active Tokens Table */}
          {activeTokens.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-medium">Active Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Created</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Expires</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Last Used</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTokens.map((token) => (
                      <tr key={token.id} className="border-b border-gray-800 hover:bg-[#1f1f33]">
                        <td className="px-4 py-3 font-medium">{token.name}</td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(token.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {token.expiresAt ? formatDate(token.expiresAt) : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(token.lastUsedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRevokeToken(token.id, token.name)}
                            className="text-red-400 transition-colors hover:text-red-300"
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
            <div className="py-8 text-center text-gray-500">
              No active tokens. Generate one to get started.
            </div>
          )}

          {/* Revoked Tokens (Collapsed) */}
          {revokedTokens.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                Show {revokedTokens.length} revoked token{revokedTokens.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Created
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Revoked
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {revokedTokens.map((token) => (
                      <tr key={token.id} className="border-b border-gray-800 opacity-60">
                        <td className="px-4 py-2 text-sm line-through">{token.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatDate(token.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">Yes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </section>

        {/* Project Controls Section */}
        <section className="shadow-neumorphic rounded-lg bg-[#1a1a2e] p-6">
          <h2 className="text-coral-400 mb-4 text-xl font-semibold">Project Controls</h2>

          {/* mcpWriteFiles Toggle */}
          <div className="mb-6 border-b border-gray-800 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mb-1 font-medium">Allow MCP to Write Helper Files</h3>
                <p className="max-w-2xl text-sm text-gray-400">
                  When enabled, agents can write <code className="text-coral-400">CLAUDE.md</code>{' '}
                  and <code className="text-coral-400">AGENTS.md</code> files to your repository
                  during onboarding and bootstrap. Disable this to keep your repository clean.
                </p>
              </div>
              <label className="ml-4 flex cursor-pointer items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={mcpWriteFiles}
                    onChange={(e) => setMcpWriteFiles(e.target.checked)}
                  />
                  <div
                    className={`block h-8 w-14 rounded-full transition-colors ${
                      mcpWriteFiles ? 'bg-coral-500' : 'bg-gray-700'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                      mcpWriteFiles ? 'translate-x-6 transform' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>

          {/* MCP Endpoint Display */}
          <div className="mb-6">
            <h3 className="mb-2 font-medium">MCP Endpoint</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border border-gray-800 bg-[#0f0f1a] px-4 py-2 text-gray-300">
                {mcpEndpoint}
              </code>
              <button
                onClick={() => copyToClipboard(mcpEndpoint)}
                className="rounded p-2 transition-colors hover:bg-[#1f1f33]"
                title="Copy endpoint"
              >
                <Copy size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Use this URL when configuring your agent&apos;s MCP connection.
            </p>
          </div>

          {/* Save Button */}
          {project.mcpWriteFiles !== mcpWriteFiles && (
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="bg-coral-500 hover:bg-coral-600 rounded-md px-6 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </section>

        {/* Wiki Templates Section */}
        <section className="shadow-neumorphic rounded-lg bg-[#1a1a2e] p-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText size={24} className="text-coral-400" />
            <div>
              <h2 className="text-coral-400 text-xl font-semibold">Wiki Templates</h2>
              <p className="text-sm text-gray-400">
                Update default wiki pages with latest templates
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-blue-700/50 bg-blue-900/20 p-4">
            <p className="text-sm text-blue-200">
              <strong>What this does:</strong> Updates system-generated wiki pages (Getting Started,
              MCP Configuration, etc.) with the latest templates. Pages you&apos;ve edited
              won&apos;t be overwritten.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreviewWikiRefresh}
              disabled={isRefreshingWikis}
              className="flex items-center gap-2 rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshingWikis ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Preview Changes
            </button>
            <button
              onClick={handleConfirmWikiRefresh}
              disabled={isRefreshingWikis}
              className="bg-coral-500 hover:bg-coral-600 flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={18} />
              Refresh Now
            </button>
          </div>
        </section>

        {/* Labels Section (Sprint 11.7) */}
        <LabelManagement projectId={project.id} labels={labels} />

        {/* Configuration Instructions */}
        <section className="shadow-neumorphic rounded-lg bg-[#1a1a2e] p-6">
          <h2 className="text-coral-400 mb-4 text-xl font-semibold">Agent Configuration</h2>
          <div className="prose prose-invert max-w-none">
            <p className="mb-4 text-gray-400">
              Configure your AI agent to connect to ProjectPulse. First, generate a token above,
              then add the configuration below.
            </p>

            {/* Claude Code Configuration */}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-white">Claude Code</h3>
              <p className="mb-2 text-sm text-gray-400">
                Edit <code className="text-coral-400">~/.claude/settings.json</code>:
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded border border-gray-800 bg-[#0f0f1a] px-4 py-3 text-sm">
                  <code className="text-gray-300">{`{
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
                  className="absolute right-2 top-2 rounded bg-gray-700 p-2 transition-colors hover:bg-gray-600"
                  title="Copy config"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Windsurf Configuration */}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-white">Windsurf</h3>
              <p className="mb-2 text-sm text-gray-400">
                Edit <code className="text-coral-400">~/.codeium/windsurf/mcp_config.json</code>:
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded border border-gray-800 bg-[#0f0f1a] px-4 py-3 text-sm">
                  <code className="text-gray-300">{`{
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
                  className="absolute right-2 top-2 rounded bg-gray-700 p-2 transition-colors hover:bg-gray-600"
                  title="Copy config"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Cursor Configuration */}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-white">Cursor</h3>
              <p className="mb-2 text-sm text-gray-400">
                Go to <strong>Settings → MCP → Add Server</strong> with:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-gray-400">
                <li>
                  <strong>Name:</strong> projectpulse
                </li>
                <li>
                  <strong>Type:</strong> HTTP
                </li>
                <li>
                  <strong>URL:</strong> <code className="text-coral-400">{mcpEndpoint}</code>
                </li>
                <li>
                  <strong>Headers:</strong>{' '}
                  <code className="text-coral-400">Authorization: Bearer &lt;YOUR_TOKEN&gt;</code>
                </li>
              </ul>
            </div>

            {/* Test Connection */}
            <div className="mb-4 rounded-lg border border-blue-700/50 bg-blue-900/20 p-4">
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
            <div className="flex items-start gap-3 rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
              <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-yellow-500" />
              <p className="text-sm text-yellow-200">
                <strong>Security Note:</strong> Store your token securely. It grants full project
                access to the agent. Revoke tokens immediately if compromised.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Generate Token Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#1a1a2e] p-6 shadow-2xl">
            <h3 className="text-coral-400 mb-4 text-xl font-semibold">Generate New Token</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g., Frontend Claude"
                  className="focus:ring-coral-500 w-full rounded-md border border-gray-700 bg-[#0f0f1a] px-4 py-2 focus:outline-none focus:ring-2"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Choose a descriptive name (unique per project)
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Expires In</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                  className="focus:ring-coral-500 w-full rounded-md border border-gray-700 bg-[#0f0f1a] px-4 py-2 focus:outline-none focus:ring-2"
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
                  className="bg-coral-500 hover:bg-coral-600 flex-1 rounded-md px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Token'}
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setTokenName('');
                  }}
                  className="rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
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
          <div className="w-full max-w-2xl rounded-lg bg-[#1a1a2e] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-500" />
              <h3 className="text-coral-400 text-xl font-semibold">Token Generated Successfully</h3>
            </div>

            <div className="mb-4 rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
              <p className="mb-2 text-sm font-medium text-yellow-200">
                ⚠️ Important: Copy this token now
              </p>
              <p className="text-sm text-yellow-200/80">
                You will not be able to see this token again. Store it securely.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Token Name</label>
              <div className="rounded border border-gray-800 bg-[#0f0f1a] px-4 py-2 text-gray-300">
                {generatedToken.name}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Token (Bearer)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded border border-gray-800 bg-[#0f0f1a] px-4 py-2 font-mono text-sm text-green-400">
                  {generatedToken.token}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedToken.token)}
                  className="bg-coral-500 hover:bg-coral-600 flex-shrink-0 rounded p-2 transition-colors"
                  title="Copy token"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Expires</label>
              <div className="rounded border border-gray-800 bg-[#0f0f1a] px-4 py-2 text-gray-300">
                {formatDate(generatedToken.expiresAt)}
              </div>
            </div>

            <button
              onClick={() => setGeneratedToken(null)}
              className="bg-coral-500 hover:bg-coral-600 w-full rounded-md px-4 py-2 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Wiki Refresh Preview Modal */}
      {showWikiRefreshModal && wikiRefreshPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="shadow-neumorphic max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[#1a1a2e] p-6">
            <h3 className="mb-4 text-lg font-semibold">Wiki Refresh Preview</h3>

            <p className="mb-4 text-gray-400">
              Review the changes that will be made to your wiki pages:
            </p>

            {/* Updated Pages */}
            {wikiRefreshPreview.updated.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckCircle2 size={16} />
                  Will be Updated ({wikiRefreshPreview.updated.length})
                </h4>
                <ul className="space-y-2 rounded-lg border border-green-700/50 bg-green-900/20 p-3">
                  {wikiRefreshPreview.updated.map((page, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-green-300">{page.title}</span>
                      <span className="block text-xs text-gray-400">{page.reason}</span>
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
                <ul className="space-y-2 rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-3">
                  {wikiRefreshPreview.skipped.map((page, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-yellow-300">{page.title}</span>
                      <span className="block text-xs text-gray-400">{page.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unchanged Pages */}
            {wikiRefreshPreview.unchanged.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-400">
                  Already Up-to-Date ({wikiRefreshPreview.unchanged.length})
                </h4>
                <ul className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                  <li className="text-sm text-gray-500">
                    {wikiRefreshPreview.unchanged.map((p) => p.title).join(', ')}
                  </li>
                </ul>
              </div>
            )}

            {/* No Changes Message */}
            {wikiRefreshPreview.updated.length === 0 &&
              wikiRefreshPreview.skipped.length === 0 &&
              wikiRefreshPreview.unchanged.length === 0 && (
                <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <p className="text-sm text-gray-400">No wiki pages found to refresh.</p>
                </div>
              )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowWikiRefreshModal(false);
                  setWikiRefreshPreview(null);
                }}
                className="flex-1 rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
              >
                Cancel
              </button>
              {wikiRefreshPreview.updated.length > 0 && (
                <button
                  onClick={handleConfirmWikiRefresh}
                  disabled={isRefreshingWikis}
                  className="bg-coral-500 hover:bg-coral-600 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
