/**
 * DocumentCard Component
 *
 * Shows document status and generation controls
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  filename: string;
  title: string;
  category: string;
  wordCountTarget: number;
  isGenerated: boolean;
  wordCount?: number;
  onGenerate: () => void;
  onView?: () => void;
}

export function DocumentCard({
  filename,
  title,
  category,
  wordCountTarget,
  isGenerated,
  wordCount,
  onGenerate,
  onView,
}: DocumentCardProps) {
  const categoryColors = {
    planning: 'bg-blue-500/20 text-blue-400',
    architecture: 'bg-purple-500/20 text-purple-400',
    implementation: 'bg-green-500/20 text-green-400',
    operations: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <Card className={cn('neu-raised smooth-transition', isGenerated && 'border-green-500/20')}>
      <CardHeader>
        <div className="mb-2 flex items-start justify-between">
          <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex gap-2">
            <Badge
              className={cn(
                'text-xs',
                categoryColors[category as keyof typeof categoryColors] ||
                  'bg-slate-500/20 text-slate-400'
              )}
            >
              {category}
            </Badge>
            {isGenerated && (
              <Badge className="bg-green-500/20 text-xs text-green-400">
                <Check className="mr-1 h-3 w-3" />
                Complete
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{filename}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate">
            <span>Target:</span>
            <span className="font-semibold">{wordCountTarget.toLocaleString()} words</span>
          </div>
          {isGenerated && wordCount && (
            <div className="flex justify-between text-xs text-green-400">
              <span>Generated:</span>
              <span className="font-semibold">{wordCount.toLocaleString()} words</span>
            </div>
          )}

          <div className="flex gap-2">
            {isGenerated ? (
              <>
                {onView && (
                  <Button variant="outline" size="sm" onClick={onView} className="flex-1">
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onGenerate} className="flex-1">
                  Regenerate
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onGenerate} className="w-full">
                <Sparkles className="mr-1 h-4 w-4" />
                Generate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
