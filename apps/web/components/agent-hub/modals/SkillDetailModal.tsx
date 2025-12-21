'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Tag, Code } from 'lucide-react';

interface SkillDetail {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  tags: string[];
  frameworks: string[];
  usageCount: number;
  lastLoadedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SkillDetailModalProps {
  skillId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkillDetailModal({ skillId, open, onOpenChange }: SkillDetailModalProps) {
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && skillId) {
      setLoading(true);
      setError(null);

      fetch(`/api/skills/by-id/${skillId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setSkill(data);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, skillId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? 'Loading...' : error ? 'Error' : skill?.title}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading skill details...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {skill && !loading && !error && (
          <div className="mt-4 space-y-6">
            {/* Metadata Row */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">{skill.category}</Badge>
              {skill.frameworks.map((fw) => (
                <Badge key={fw} variant="secondary">
                  {fw}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {skill.description && (
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">{skill.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Usage</span>
                </div>
                <div className="text-lg font-semibold text-white">{skill.usageCount}</div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last Used</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {skill.lastLoadedAt ? new Date(skill.lastLoadedAt).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </div>
                <div className="text-sm font-medium text-white">{skill.tags.length}</div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>Slug</span>
                </div>
                <div className="truncate font-mono text-xs text-white">{skill.slug}</div>
              </div>
            </div>

            {/* Tags */}
            {skill.tags.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Content</h4>
              <div className="neu-inset max-h-96 overflow-y-auto rounded-lg p-6">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate sm:text-sm">
                  {skill.content}
                </pre>
              </div>
            </div>

            {/* MCP Usage */}
            <div className="neu-raised rounded-lg p-4">
              <h4 className="mb-2 text-sm font-semibold text-white">Load via MCP</h4>
              <code className="block rounded bg-background px-3 py-2 font-mono text-xs text-slate">
                projectpulse.skill.load(&quot;{skill.slug}&quot;)
              </code>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
