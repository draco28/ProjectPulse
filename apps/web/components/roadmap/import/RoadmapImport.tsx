'use client';

/**
 * RoadmapImport Component - Standalone Roadmap UI Phase C
 *
 * Container managing the import flow:
 * 1. Choose method (file upload or paste)
 * 2. Parse and validate JSON
 * 3. Preview structure
 * 4. Import to database
 *
 * @see .agent/task/roadmap-ui/ROADMAP-UI-COMPONENTS.md
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileJson, ClipboardPaste } from 'lucide-react';
import { JsonFileUpload } from './JsonFileUpload';
import { JsonPasteArea } from './JsonPasteArea';
import { ImportPreview } from './ImportPreview';
import { ImportValidationErrors } from './ImportValidationErrors';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedPhase {
  title?: string;
  name?: string;
  description?: string;
  duration?: string;
  sprints: Array<{
    name: string;
    duration?: string;
    weeks?: string;
    goals: string[];
    deliverables: string[];
    storyPoints?: number;
  }>;
}

export interface ParsedRoadmap {
  phases: ParsedPhase[];
}

export interface ValidationError {
  path: string[];
  message: string;
}

type ImportMethod = 'file' | 'paste';
type ImportStatus = 'idle' | 'parsing' | 'previewing' | 'importing' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

interface RoadmapImportProps {
  projectId: number;
  projectName: string;
}

export function RoadmapImport({ projectId, projectName }: RoadmapImportProps) {
  const router = useRouter();

  const [method, setMethod] = useState<ImportMethod>('file');
  const [rawInput, setRawInput] = useState('');
  const [parsed, setParsed] = useState<ParsedRoadmap | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [importError, setImportError] = useState<string | null>(null);

  // Parse JSON input
  const parseJson = useCallback((input: string): ParsedRoadmap | null => {
    try {
      const data = JSON.parse(input);

      // Validate basic structure
      if (!data.phases || !Array.isArray(data.phases)) {
        setValidationErrors([
          { path: ['phases'], message: 'Missing required "phases" array' },
        ]);
        return null;
      }

      const errors: ValidationError[] = [];

      // Validate each phase
      data.phases.forEach((phase: ParsedPhase, pIndex: number) => {
        if (!phase.title && !phase.name) {
          errors.push({
            path: ['phases', String(pIndex)],
            message: `Phase ${pIndex + 1} must have "title" or "name"`,
          });
        }

        if (!phase.sprints || !Array.isArray(phase.sprints) || phase.sprints.length === 0) {
          errors.push({
            path: ['phases', String(pIndex), 'sprints'],
            message: `Phase ${pIndex + 1} must have at least one sprint`,
          });
        } else {
          phase.sprints.forEach((sprint, sIndex: number) => {
            if (!sprint.name) {
              errors.push({
                path: ['phases', String(pIndex), 'sprints', String(sIndex)],
                message: `Sprint ${sIndex + 1} in Phase ${pIndex + 1} must have "name"`,
              });
            }
          });
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        return null;
      }

      setValidationErrors([]);
      return data as ParsedRoadmap;
    } catch (err) {
      setValidationErrors([
        { path: [], message: err instanceof Error ? err.message : 'Invalid JSON syntax' },
      ]);
      return null;
    }
  }, []);

  // Handle file content
  const handleFileContent = useCallback(
    (content: string) => {
      setRawInput(content);
      setStatus('parsing');
      const result = parseJson(content);
      if (result) {
        setParsed(result);
        setStatus('previewing');
      } else {
        setStatus('error');
      }
    },
    [parseJson]
  );

  // Handle paste content
  const handlePasteChange = useCallback((value: string) => {
    setRawInput(value);
    setParsed(null);
    setValidationErrors([]);
    setStatus('idle');
  }, []);

  // Parse pasted content
  const handleParsePaste = useCallback(() => {
    if (!rawInput.trim()) {
      setValidationErrors([{ path: [], message: 'Please paste JSON content' }]);
      setStatus('error');
      return;
    }

    setStatus('parsing');
    const result = parseJson(rawInput);
    if (result) {
      setParsed(result);
      setStatus('previewing');
    } else {
      setStatus('error');
    }
  }, [rawInput, parseJson]);

  // Cancel preview
  const handleCancel = useCallback(() => {
    setParsed(null);
    setStatus('idle');
    setValidationErrors([]);
    setImportError(null);
  }, []);

  // Import roadmap
  const handleImport = useCallback(async () => {
    if (!parsed) return;

    setStatus('importing');
    setImportError(null);

    try {
      const response = await fetch('/api/roadmap/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          source: { type: 'json', data: parsed },
          materialize: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setImportError(result.error?.message || 'Failed to import roadmap');
        setStatus('error');
        return;
      }

      setStatus('success');
      // Redirect to roadmap page after short delay (preserve project context)
      setTimeout(() => {
        router.push(`/roadmap?project=${projectId}`);
      }, 1500);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  }, [parsed, projectId, router]);

  return (
    <div className="neu-raised rounded-3xl p-8">
      {/* Project Context */}
      <div className="mb-6 text-center">
        <span className="text-sm text-slate">
          Importing to: <span className="text-coral font-medium">{projectName}</span>
        </span>
      </div>

      {/* Success State */}
      {status === 'success' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Import Successful!</h3>
          <p className="text-slate">Redirecting to your roadmap...</p>
        </div>
      )}

      {/* Preview State */}
      {(status === 'previewing' || status === 'importing') && parsed && (
        <ImportPreview
          roadmap={parsed}
          onConfirm={handleImport}
          onCancel={handleCancel}
          isImporting={status === 'importing'}
        />
      )}

      {/* Input State */}
      {(status === 'idle' || status === 'parsing' || status === 'error') && (
        <>
          {/* Method Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setMethod('file')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl
                font-medium transition-all duration-200
                ${method === 'file'
                  ? 'coral-gradient text-white'
                  : 'neu-flat text-slate hover:text-white'
                }
              `}
            >
              <FileJson className="h-5 w-5" />
              Upload File
            </button>
            <button
              onClick={() => setMethod('paste')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl
                font-medium transition-all duration-200
                ${method === 'paste'
                  ? 'coral-gradient text-white'
                  : 'neu-flat text-slate hover:text-white'
                }
              `}
            >
              <ClipboardPaste className="h-5 w-5" />
              Paste JSON
            </button>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <ImportValidationErrors errors={validationErrors} />
          )}

          {/* Import Error */}
          {importError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{importError}</p>
            </div>
          )}

          {/* File Upload */}
          {method === 'file' && (
            <JsonFileUpload
              onFileSelect={handleFileContent}
              isDisabled={status === 'parsing'}
            />
          )}

          {/* Paste Area */}
          {method === 'paste' && (
            <JsonPasteArea
              value={rawInput}
              onChange={handlePasteChange}
              onParse={handleParsePaste}
              isDisabled={status === 'parsing'}
            />
          )}

          {/* Example Format */}
          <div className="mt-8 neu-flat rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-2">Expected JSON Format:</h4>
            <pre className="text-xs text-slate overflow-x-auto">
{`{
  "phases": [
    {
      "title": "Phase 1: Foundation",
      "duration": "4 weeks",
      "sprints": [
        {
          "name": "Sprint 1",
          "weeks": "Weeks 1-2",
          "goals": ["Setup project", "Configure CI/CD"],
          "deliverables": ["Working repo", "CI pipeline"]
        }
      ]
    }
  ]
}`}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
