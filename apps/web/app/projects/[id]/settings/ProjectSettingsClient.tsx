'use client';

/**
 * Project Settings Client Component (Sprint 9)
 *
 * Interactive UI for managing agent tokens and project settings.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
  mcpEndpoint: string;
}

export function ProjectSettingsClient({ project, tokens, mcpEndpoint }: ProjectSettingsClientProps) {
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
    if (!confirm(`Are you sure you want to revoke the token "${tokenName}"? This action cannot be undone.`)) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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
    <div className="min-h-screen bg-[#0f0f1a] text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-coral-400 mb-2">Project Settings</h1>
        <p className="text-gray-400">{project.name}</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Agent Tokens Section */}
        <section className="bg-[#1a1a2e] rounded-lg p-6 shadow-neumorphic">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-coral-400 mb-1">Agent Tokens</h2>
              <p className="text-sm text-gray-400">
                Manage bearer tokens for agent MCP access
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors"
            >
              <Plus size={18} />
              Generate New Token
            </button>
          </div>

          {/* Active Tokens Table */}
          {activeTokens.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Active Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Expires</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Used</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTokens.map((token) => (
                      <tr key={token.id} className="border-b border-gray-800 hover:bg-[#1f1f33]">
                        <td className="py-3 px-4 font-medium">{token.name}</td>
                        <td className="py-3 px-4 text-gray-400">{formatDate(token.createdAt)}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {token.expiresAt ? formatDate(token.expiresAt) : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">{formatDate(token.lastUsedAt)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRevokeToken(token.id, token.name)}
                            className="text-red-400 hover:text-red-300 transition-colors"
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
            <div className="text-center py-8 text-gray-500">
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
                      <th className="text-left py-2 px-4 text-gray-500 font-medium text-sm">Name</th>
                      <th className="text-left py-2 px-4 text-gray-500 font-medium text-sm">Created</th>
                      <th className="text-left py-2 px-4 text-gray-500 font-medium text-sm">Revoked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revokedTokens.map((token) => (
                      <tr key={token.id} className="border-b border-gray-800 opacity-60">
                        <td className="py-2 px-4 text-sm line-through">{token.name}</td>
                        <td className="py-2 px-4 text-sm text-gray-500">{formatDate(token.createdAt)}</td>
                        <td className="py-2 px-4 text-sm text-gray-500">Yes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </section>

        {/* Project Controls Section */}
        <section className="bg-[#1a1a2e] rounded-lg p-6 shadow-neumorphic">
          <h2 className="text-xl font-semibold text-coral-400 mb-4">Project Controls</h2>

          {/* mcpWriteFiles Toggle */}
          <div className="mb-6 pb-6 border-b border-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">Allow MCP to Write Helper Files</h3>
                <p className="text-sm text-gray-400 max-w-2xl">
                  When enabled, agents can write <code className="text-coral-400">CLAUDE.md</code> and{' '}
                  <code className="text-coral-400">AGENTS.md</code> files to your repository during
                  onboarding and bootstrap. Disable this to keep your repository clean.
                </p>
              </div>
              <label className="flex items-center cursor-pointer ml-4">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={mcpWriteFiles}
                    onChange={(e) => setMcpWriteFiles(e.target.checked)}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${
                      mcpWriteFiles ? 'bg-coral-500' : 'bg-gray-700'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                      mcpWriteFiles ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>

          {/* MCP Endpoint Display */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">MCP Endpoint</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0f0f1a] px-4 py-2 rounded border border-gray-800 text-gray-300">
                {mcpEndpoint}
              </code>
              <button
                onClick={() => copyToClipboard(mcpEndpoint)}
                className="p-2 hover:bg-[#1f1f33] rounded transition-colors"
                title="Copy endpoint"
              >
                <Copy size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this URL when configuring your agent's MCP connection.
            </p>
          </div>

          {/* Save Button */}
          {project.mcpWriteFiles !== mcpWriteFiles && (
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-6 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </section>

        {/* Configuration Instructions */}
        <section className="bg-[#1a1a2e] rounded-lg p-6 shadow-neumorphic">
          <h2 className="text-xl font-semibold text-coral-400 mb-4">Agent Configuration</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400 mb-3">
              To configure an agent (Claude Code, Windsurf, etc.) to use this project:
            </p>
            <ol className="text-gray-400 space-y-2 list-decimal list-inside">
              <li>Generate a new token above and copy it</li>
              <li>
                Set the MCP URL to: <code className="text-coral-400">{mcpEndpoint}</code>
              </li>
              <li>
                Add the Authorization header:{' '}
                <code className="text-coral-400">Bearer &lt;your-token&gt;</code>
              </li>
              <li>Test the connection by calling any MCP tool</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-coral-400 mb-4">Generate New Token</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g., Frontend Claude"
                  className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name (unique per project)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expires In</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleGenerateToken}
                  disabled={isGenerating || !tokenName.trim()}
                  className="flex-1 px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Token'}
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setTokenName('');
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 size={24} className="text-green-500" />
              <h3 className="text-xl font-semibold text-coral-400">Token Generated Successfully</h3>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 text-sm font-medium mb-2">
                ⚠️ Important: Copy this token now
              </p>
              <p className="text-yellow-200/80 text-sm">
                You will not be able to see this token again. Store it securely.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Token Name</label>
              <div className="text-gray-300 px-4 py-2 bg-[#0f0f1a] rounded border border-gray-800">
                {generatedToken.name}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Token (Bearer)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#0f0f1a] px-4 py-2 rounded border border-gray-800 text-sm text-green-400 font-mono overflow-x-auto whitespace-nowrap">
                  {generatedToken.token}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedToken.token)}
                  className="p-2 bg-coral-500 hover:bg-coral-600 rounded transition-colors flex-shrink-0"
                  title="Copy token"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Expires</label>
              <div className="text-gray-300 px-4 py-2 bg-[#0f0f1a] rounded border border-gray-800">
                {formatDate(generatedToken.expiresAt)}
              </div>
            </div>

            <button
              onClick={() => setGeneratedToken(null)}
              className="w-full px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
