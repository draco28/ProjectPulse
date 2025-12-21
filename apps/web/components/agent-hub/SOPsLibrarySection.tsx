'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Calendar } from 'lucide-react';
import { SOPDetailModal } from './modals/SOPDetailModal';

interface SOP {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SOPsLibrarySectionProps {
  sops: SOP[];
}

export function SOPsLibrarySection({ sops }: SOPsLibrarySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSOP, setSelectedSOP] = useState<number | null>(null);

  // Filter SOPs
  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch =
      searchTerm === '' ||
      sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || sop.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories
  const categories = Array.from(new Set(sops.map((s) => s.category))).sort();

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="neu-raised smooth-transition rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search SOPs by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSOPs.length} of {sops.length} SOPs
          </p>
        </div>

        {/* SOPs List (not grid - text-heavy content) */}
        {filteredSOPs.length > 0 ? (
          <div className="space-y-4">
            {filteredSOPs.map((sop) => (
              <Card
                key={sop.id}
                className="neu-raised smooth-transition cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedSOP(sop.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg leading-tight text-white">
                        {sop.title}
                      </CardTitle>
                      <p className="line-clamp-2 text-sm text-slate">{sop.description}</p>
                    </div>
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Badge */}
                    <Badge variant="default" className="text-xs">
                      {sop.category}
                    </Badge>

                    {/* Tags */}
                    {sop.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {sop.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sop.tags.length - 3}
                      </Badge>
                    )}

                    {/* Divider */}
                    <span className="text-muted-foreground">•</span>

                    {/* Last Updated */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Updated {new Date(sop.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
            <div className="mb-4 text-4xl">📋</div>
            <h3 className="mb-2 text-xl font-bold text-white">No SOPs found</h3>
            <p className="text-sm text-slate">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No SOPs have been created for this project yet'}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="neu-inset rounded-3xl p-6">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-semibold text-white">
              <span>📚</span> How SOPs Work
            </p>
            <p className="text-sm leading-relaxed text-slate">
              SOPs (Standard Operating Procedures) are project-wide documentation available to{' '}
              <strong>all agents</strong> in your project. Any agent can reference SOPs when
              performing tasks that require following specific procedures or guidelines. SOPs are
              created during Session 3 and contain step-by-step instructions, best practices, and
              coding standards.
            </p>
          </div>
        </div>
      </div>

      {/* SOP Detail Modal */}
      {selectedSOP && (
        <SOPDetailModal
          sopId={selectedSOP}
          open={!!selectedSOP}
          onOpenChange={(open) => !open && setSelectedSOP(null)}
        />
      )}
    </>
  );
}
