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
import { Search } from 'lucide-react';

interface Skill {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  frameworks: string[];
  usageCount: number;
  lastLoadedAt: Date | null;
}

interface AgentSkillsTabProps {
  agent: {
    skills: string[]; // Skill slugs
    skillDetails: Skill[]; // Full Skill objects
  };
}

export function AgentSkillsTab({ agent }: AgentSkillsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter skills by search term and category
  const filteredSkills = agent.skillDetails.filter((skill) => {
    const matchesSearch =
      skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' || skill.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories
  const categories = Array.from(
    new Set(agent.skillDetails.map((s) => s.category))
  ).sort();

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSkills.length} of {agent.skillDetails.length} skills
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill) => (
          <Card key={skill.id} className="neu-flat hover:neu-raised smooth-transition">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title */}
                <h4 className="font-semibold text-lg leading-tight">
                  {skill.title}
                </h4>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {skill.description}
                </p>

                {/* Badges: Category + Frameworks */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-xs">
                    {skill.category}
                  </Badge>
                  {skill.frameworks.slice(0, 3).map((fw) => (
                    <Badge key={fw} variant="secondary" className="text-xs">
                      {fw}
                    </Badge>
                  ))}
                  {skill.frameworks.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{skill.frameworks.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Usage Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="font-medium">
                    Used {skill.usageCount} times
                  </span>
                  {skill.lastLoadedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Last used{' '}
                        {new Date(skill.lastLoadedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🔍</div>
          <p className="text-lg font-medium">No skills found</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'This agent has no skills configured'}
          </p>
        </div>
      )}

      {/* Info Banner */}
      <div className="neu-inset rounded-lg p-4 text-sm space-y-2">
        <p className="font-medium">💡 How Skills Work</p>
        <p className="text-muted-foreground leading-relaxed">
          This agent can autonomously load these skills when needed via the MCP
          tool <code className="bg-background px-1.5 py-0.5 rounded">projectpulse.skill.load(slug)</code>.
          Skills contain detailed patterns, code examples, and procedures - similar to
          Claude Code&apos;s <code className="bg-background px-1.5 py-0.5 rounded">.claude/skills/</code> folder.
        </p>
      </div>
    </div>
  );
}
