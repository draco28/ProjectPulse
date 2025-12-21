/**
 * PromptDialog Component
 *
 * Shows agent prompt with copy functionality for MCP workflow
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string;
  userPrompt: string;
  onComplete: (result: string) => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  systemPrompt,
  userPrompt,
  onComplete,
}: PromptDialogProps) {
  const [systemCopied, setSystemCopied] = useState(false);
  const [userCopied, setUserCopied] = useState(false);
  const [result, setResult] = useState('');

  const handleCopy = async (text: string, type: 'system' | 'user') => {
    await navigator.clipboard.writeText(text);
    if (type === 'system') {
      setSystemCopied(true);
      setTimeout(() => setSystemCopied(false), 2000);
    } else {
      setUserCopied(true);
      setTimeout(() => setUserCopied(false), 2000);
    }
  };

  const handleSubmit = () => {
    if (result.trim()) {
      onComplete(result);
      setResult('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Generation Prompt</DialogTitle>
          <DialogDescription>
            Copy these prompts to your AI agent (Claude Code, ChatGPT, etc.) to generate the
            executive summary, then paste the result below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Prompt */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-white">System Prompt</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(systemPrompt, 'system')}
              >
                {systemCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="neu-inset max-h-48 overflow-y-auto rounded-md border border-slate-700 bg-slate-900/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300">
                {systemPrompt}
              </pre>
            </div>
          </div>

          {/* User Prompt */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                User Prompt (All 96 Q&A Pairs)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(userPrompt, 'user')}
              >
                {userCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="neu-inset max-h-48 overflow-y-auto rounded-md border border-slate-700 bg-slate-900/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300">
                {userPrompt}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-4">
            <h4 className="mb-2 text-sm font-semibold text-blue-400">Instructions:</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-slate-300">
              <li>Copy the System Prompt and User Prompt above</li>
              <li>Open your AI agent (Claude Code, ChatGPT, etc.)</li>
              <li>Paste the System Prompt first, then the User Prompt</li>
              <li>Generate the executive summary (~500 words)</li>
              <li>Copy the generated summary and paste it below</li>
            </ol>
          </div>

          {/* Result Input */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Paste Generated Summary
            </label>
            <Textarea
              placeholder="Paste the AI-generated executive summary here..."
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={10}
              className="neu-inset border-slate-700 bg-slate-900/50 text-white"
            />
            <p className="mt-2 text-xs text-slate-400">
              Word count: {result.split(/\s+/).filter((w) => w).length} words
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!result.trim()}>
              Store Summary
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
