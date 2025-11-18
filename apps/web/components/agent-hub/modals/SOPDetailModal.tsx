'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SOPDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SOPDetailModalProps {
  sopId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SOPDetailModal({
  sopId,
  open,
  onOpenChange,
}: SOPDetailModalProps) {
  const [sop, setSOP] = useState<SOPDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && sopId) {
      setLoading(true);
      setError(null);

      fetch(`/api/sops/by-id/${sopId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setSOP(data);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, sopId]);

  const handleDownload = () => {
    if (!sop) return;

    const blob = new Blob([sop.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sop.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? 'Loading...' : error ? 'Error' : sop?.title}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading SOP details...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {sop && !loading && !error && (
          <div className="space-y-6 mt-4">
            {/* Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{sop.category}</Badge>
                {sop.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <button
                onClick={handleDownload}
                className="neu-raised smooth-transition rounded-lg px-4 py-2 text-sm font-medium text-white flex items-center gap-2 hover:shadow-lg"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Description */}
            {sop.description && (
              <div className="neu-inset rounded-lg p-4">
                <p className="text-sm text-slate leading-relaxed">
                  {sop.description}
                </p>
              </div>
            )}

            {/* Content (Markdown) */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content
              </h4>
              <div className="neu-raised rounded-lg p-6 max-h-96 overflow-y-auto prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{sop.content}</ReactMarkdown>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {new Date(sop.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Last Updated</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {new Date(sop.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* MCP Reference */}
            <div className="neu-raised rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Reference via MCP</h4>
              <code className="text-xs bg-background px-3 py-2 rounded block font-mono text-slate">
                projectpulse.sop.get(&quot;{sop.slug}&quot;)
              </code>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
