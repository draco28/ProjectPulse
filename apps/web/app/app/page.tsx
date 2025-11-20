'use client';

/**
 * User Dashboard (/app)
 * Sprint 8.9: User's project hub with onboarding status
 * 
 * Features:
 * - List all user projects
 * - Show onboarding progress per project
 * - Create new project modal
 * - Navigate to project dashboard
 */

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { FloatingBackground } from '@/components/FloatingBackground';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: number;
  name: string;
  description: string | null;
  repository: string | null;
  createdAt: string;
  updatedAt: string;
  issueCount: number;
  onboarding: {
    progress: number;
    complete: boolean;
    sessions: number;
    completedSessions: number;
  };
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repository, setRepository] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to load projects');

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, repository }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.issues) {
          setError(data.issues[0]?.message || 'Validation failed');
        } else {
          setError(data.error || 'Failed to create project');
        }
        return;
      }

      // Reset form and reload projects
      setName('');
      setDescription('');
      setRepository('');
      setShowCreateDialog(false);
      await loadProjects();
    } catch (err) {
      console.error('Create project error:', err);
      setError('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenProject = (projectId: number) => {
    router.push(`/dashboard?project=${projectId}`);
  };

  if (loading) {
    return (
      <>
        <FloatingBackground />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingBackground />

      {/* Main Content */}
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Add a new project to start tracking issues and onboarding
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name *</Label>
                      <Input
                        id="project-name"
                        type="text"
                        placeholder="My Awesome Project"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        placeholder="Brief description of your project..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={creating}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-repository">Repository URL</Label>
                      <Input
                        id="project-repository"
                        type="url"
                        placeholder="https://github.com/username/repo"
                        value={repository}
                        onChange={(e) => setRepository(e.target.value)}
                        disabled={creating}
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Project'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Get started by creating your first project
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="glass-card cursor-pointer transition-all hover:scale-105"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-1">{project.name}</span>
                      {project.onboarding.complete && (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Onboarding Progress */}
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Onboarding</span>
                          <span className="font-medium">{Math.round(project.onboarding.progress)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${project.onboarding.progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.onboarding.completedSessions} of 3 sessions complete
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{project.issueCount}</span>
                          <span>issues</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
