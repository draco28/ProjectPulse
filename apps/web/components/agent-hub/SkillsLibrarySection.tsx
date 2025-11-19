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
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp } from 'lucide-react';
import { SkillDetailModal } from './modals/SkillDetailModal';

interface Skill {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  frameworks: string[];
  usageCount: number;
  lastLoadedAt: Date | null;
}

interface SkillsLibrarySectionProps {
  skills: Skill[];
}

export function SkillsLibrarySection({ skills }: SkillsLibrarySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      searchTerm === '' ||
      skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;

    const matchesFramework =
      frameworkFilter === 'all' || skill.frameworks.includes(frameworkFilter);

    return matchesSearch && matchesCategory && matchesFramework;
  });

  // Extract unique categories and frameworks
  const categories = Array.from(new Set(skills.map((s) => s.category))).sort();
  const allFrameworks = Array.from(
    new Set(skills.flatMap((s) => s.frameworks))
  ).sort();

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="neu-raised smooth-transition rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills by name, description, or tags..."
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
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  {allFrameworks.map((fw) => (
                    <SelectItem key={fw} value={fw}>
                      {fw}
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
            Showing {filteredSkills.length} of {skills.length} skills
          </p>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((skill) => (
              <Card
                key={skill.id}
                className="neu-raised smooth-transition cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedSkill(skill.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Title */}
                    <h3 className="text-lg font-semibold leading-tight text-white">
                      {skill.title}
                    </h3>

                    {/* Description */}
                    {skill.description && (
                      <p className="text-sm text-slate line-clamp-2">
                        {skill.description}
                      </p>
                    )}

                    {/* Badges: Category + Frameworks */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="default" className="text-xs">
                        {skill.category}
                      </Badge>
                      {skill.frameworks.slice(0, 2).map((fw) => (
                        <Badge key={fw} variant="secondary" className="text-xs">
                          {fw}
                        </Badge>
                      ))}
                      {skill.frameworks.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{skill.frameworks.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Usage Stats */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/10">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">
                        {skill.usageCount} {skill.usageCount === 1 ? 'use' : 'uses'}
                      </span>
                      {skill.lastLoadedAt && (
                        <>
                          <span>•</span>
                          <span>
                            Last used {new Date(skill.lastLoadedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="mb-2 text-xl font-bold text-white">No skills found</h3>
            <p className="text-sm text-slate">
              {searchTerm || categoryFilter !== 'all' || frameworkFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No skills have been created for this project yet'}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="neu-inset rounded-3xl p-6">
          <div className="space-y-2">
            <p className="font-semibold text-white flex items-center gap-2">
              <span>💡</span> How Skills Work
            </p>
            <p className="text-sm text-slate leading-relaxed">
              Skills are project-wide resources available to <strong>all agents</strong> (including the main agent). 
              Any agent can autonomously load skills when relevant via the MCP tool{' '}
              <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                projectpulse.skill.load(slug)
              </code>
              . Skills contain detailed patterns, code examples, and procedures - similar to{' '}
              <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                .claude/skills/
              </code>{' '}
              in Claude Code.
            </p>
          </div>
        </div>
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          skillId={selectedSkill}
          open={!!selectedSkill}
          onOpenChange={(open) => !open && setSelectedSkill(null)}
        />
      )}
    </>
  );
}
