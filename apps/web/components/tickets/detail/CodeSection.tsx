/**
 * CodeSection Component
 *
 * Server Component that displays linked code files and line references
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (static rendering)
 * - Receives explicit props for linked files
 * - Displays file paths with optional line numbers
 * - Future enhancement: Fetch and display actual code snippets
 *
 * Props:
 * - linkedFiles: Array of linked file objects with filePath, lineNumber, createdAt
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface LinkedFile {
  id: string; // Serialized from number
  filePath: string;
  lineNumber: number | null;
  createdAt: string; // ISO 8601 date string
}

interface CodeSectionProps {
  linkedFiles: LinkedFile[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract filename from full file path
 */
function getFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * Get file extension for icon selection
 */
function getFileExtension(filePath: string): string {
  const fileName = getFileName(filePath);
  const parts = fileName.split('.');
  const ext = parts[parts.length - 1];
  return parts.length > 1 && ext ? ext.toLowerCase() : '';
}

/**
 * Get icon class based on file extension
 */
function getFileIcon(filePath: string): string {
  const ext = getFileExtension(filePath);

  const iconMap: Record<string, string> = {
    js: 'fab fa-js text-yellow-400',
    jsx: 'fab fa-react text-blue-400',
    ts: 'fab fa-js text-blue-500',
    tsx: 'fab fa-react text-blue-500',
    py: 'fab fa-python text-blue-400',
    java: 'fab fa-java text-orange-600',
    cpp: 'fas fa-file-code text-blue-500',
    c: 'fas fa-file-code text-blue-600',
    cs: 'fas fa-file-code text-purple-500',
    go: 'fas fa-file-code text-cyan-400',
    rs: 'fas fa-file-code text-orange-500',
    html: 'fab fa-html5 text-orange-600',
    css: 'fab fa-css3-alt text-blue-500',
    json: 'fas fa-brackets-curly text-yellow-500',
    md: 'fab fa-markdown text-slate-400',
    txt: 'fas fa-file-alt text-slate-400',
  };

  return iconMap[ext] || 'fas fa-file-code text-slate';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CodeSection({ linkedFiles }: CodeSectionProps) {
  if (linkedFiles.length === 0) {
    return null; // Don't render if no linked files
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-code text-coral" aria-hidden="true"></i>
          Linked Files
          <span className="text-sm font-normal text-slate">({linkedFiles.length})</span>
        </h3>
      </div>

      {/* Linked Files List */}
      <div className="space-y-3">
        {linkedFiles.map((file) => (
          <div
            key={file.id}
            className="smooth-transition rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 hover:border-coral/30"
          >
            {/* File Header */}
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 overflow-hidden">
                {/* File Icon */}
                <i className={`mt-0.5 ${getFileIcon(file.filePath)}`} aria-hidden="true"></i>

                {/* File Path */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-mono text-sm font-medium text-white">
                      {getFileName(file.filePath)}
                    </span>
                    {file.lineNumber && (
                      <span className="flex-shrink-0 font-mono text-xs text-coral">
                        L{file.lineNumber}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-slate" title={file.filePath}>
                    {file.filePath}
                  </p>
                </div>
              </div>

              {/* Linked Date */}
              <time
                className="flex-shrink-0 text-xs text-slate"
                dateTime={file.createdAt}
                title={format(new Date(file.createdAt), 'PPpp')}
              >
                {format(new Date(file.createdAt), 'MMM d')}
              </time>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="smooth-transition hover:text-coralLight text-xs text-coral">
                <i className="fas fa-external-link-alt mr-1.5" aria-hidden="true"></i>
                Open in editor
              </button>
              <button className="smooth-transition text-xs text-slate hover:text-white">
                <i className="fas fa-copy mr-1.5" aria-hidden="true"></i>
                Copy path
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Future Enhancement Hint */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#2A2A2A] p-4 text-center">
        <p className="text-xs text-slate">
          <i className="fas fa-lightbulb mr-2 text-coral" aria-hidden="true"></i>
          Future: Inline code snippets with syntax highlighting
        </p>
      </div>
    </div>
  );
}
