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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="flex items-center justify-between mb-2">
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
            <div className="neu-inset bg-slate-900/50 border border-slate-700 rounded-md p-4 max-h-48 overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                {systemPrompt}
              </pre>
            </div>
          </div>

          {/* User Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
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
            <div className="neu-inset bg-slate-900/50 border border-slate-700 rounded-md p-4 max-h-48 overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                {userPrompt}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Instructions:</h4>
            <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
              <li>Copy the System Prompt and User Prompt above</li>
              <li>Open your AI agent (Claude Code, ChatGPT, etc.)</li>
              <li>Paste the System Prompt first, then the User Prompt</li>
              <li>Generate the executive summary (~500 words)</li>
              <li>Copy the generated summary and paste it below</li>
            </ol>
          </div>

          {/* Result Input */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">
              Paste Generated Summary
            </label>
            <Textarea
              placeholder="Paste the AI-generated executive summary here..."
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={10}
              className="neu-inset bg-slate-900/50 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-400 mt-2">
              Word count: {result.split(/\s+/).filter((w) => w).length} words
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!result.trim()}
            >
              Store Summary
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
