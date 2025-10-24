/**
 * QuickActionsWidget Component
 *
 * Widget with quick action buttons:
 * - Create Issue
 * - Add Knowledge
 * - Run Agent
 */
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Lightbulb, Zap } from 'lucide-react';

export function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="hover:bg-accent-primary/90 w-full justify-start bg-accent-primary text-white"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Issue
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start hover:bg-background-light"
          size="lg"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Add Knowledge
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start hover:bg-background-light"
          size="lg"
        >
          <Zap className="mr-2 h-4 w-4" />
          Run Agent
        </Button>
      </CardContent>
    </Card>
  );
}
