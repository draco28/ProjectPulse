'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export function SkillDetailModal({
  skillId,
  open,
  onOpenChange,
}: SkillDetailModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
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
          <div className="space-y-6 mt-4">
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {skill.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Usage</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {skill.usageCount}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Last Used</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {skill.lastLoadedAt
                    ? new Date(skill.lastLoadedAt).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {skill.tags.length}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Code className="h-4 w-4" />
                  <span>Slug</span>
                </div>
                <div className="text-xs font-mono text-white truncate">
                  {skill.slug}
                </div>
              </div>
            </div>

            {/* Tags */}
            {skill.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Tags</h4>
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
              <h4 className="text-sm font-semibold text-white mb-3">Content</h4>
              <div className="neu-inset rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed text-slate">
                  {skill.content}
                </pre>
              </div>
            </div>

            {/* MCP Usage */}
            <div className="neu-raised rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Load via MCP</h4>
              <code className="text-xs bg-background px-3 py-2 rounded block font-mono text-slate">
                projectpulse.skill.load(&quot;{skill.slug}&quot;)
              </code>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
