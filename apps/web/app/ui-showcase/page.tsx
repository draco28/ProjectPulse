/**
 * UI Showcase Page
 *
 * Test page to verify design system works across all 4 themes
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heart, Star, AlertCircle, CheckCircle } from 'lucide-react';

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-background-darkest p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="gradient-text text-4xl font-bold">UI Design System Showcase</h1>
          <p className="text-text-secondary">Testing all components across 4 themes</p>
        </div>

        <Separator />

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Color Palette</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-background-light bg-background-darkest p-4">
              <div className="text-sm text-text-secondary">Darkest</div>
            </div>
            <div className="rounded-lg border border-background-light bg-background-dark p-4">
              <div className="text-sm text-text-secondary">Dark</div>
            </div>
            <div className="rounded-lg border border-background-light bg-background-medium p-4">
              <div className="text-sm text-text-secondary">Medium</div>
            </div>
            <div className="border-accent-primary rounded-lg border bg-background-light p-4">
              <div className="text-sm text-text-secondary">Light</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-accent-primary rounded-lg p-4">
              <div className="text-sm font-medium text-white">Accent Primary</div>
            </div>
            <div className="bg-accent-secondary rounded-lg p-4">
              <div className="text-sm font-medium text-white">Accent Secondary</div>
            </div>
            <div className="bg-accent-tertiary rounded-lg p-4">
              <div className="text-sm font-medium text-white">Accent Tertiary</div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <Separator />

        {/* Cards with Effects */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Cards with Theme Effects</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="neu-float">
              <CardHeader>
                <CardTitle>Neumorphic Float</CardTitle>
                <CardDescription>Desert Stone Theme</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">Hover to see elevation effect</p>
              </CardContent>
            </Card>

            <Card className="glow-primary-hover">
              <CardHeader>
                <CardTitle>Neon Glow</CardTitle>
                <CardDescription>Neon Vibes Theme</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">Hover to see glow effect</p>
              </CardContent>
            </Card>

            <Card className="neu-raised">
              <CardHeader>
                <CardTitle>Raised Neumorphic</CardTitle>
                <CardDescription>Dark Coral Theme</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">Boxy raised effect</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Badges & Status</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-text-primary">Priority Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-error/20 border-error/30 text-error">Critical</Badge>
              <Badge className="bg-warning/20 border-warning/30 text-warning">High</Badge>
              <Badge className="bg-info/20 border-info/30 text-info">Medium</Badge>
              <Badge className="bg-text-tertiary/20 border-text-tertiary/30 text-text-tertiary">
                Low
              </Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Animations</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="animate-pulse-glow">
              <CardContent className="pt-6 text-center">
                <Heart className="text-accent-primary mx-auto mb-2 h-12 w-12" />
                <p className="text-sm text-text-secondary">Pulse Glow</p>
              </CardContent>
            </Card>

            <Card className="animate-heartbeat">
              <CardContent className="pt-6 text-center">
                <Star className="text-accent-primary mx-auto mb-2 h-12 w-12" />
                <p className="text-sm text-text-secondary">Heartbeat</p>
              </CardContent>
            </Card>

            <Card className="animate-breathing">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-success" />
                <p className="text-sm text-text-secondary">Breathing</p>
              </CardContent>
            </Card>

            <Card className="animate-float">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-12 w-12 text-warning" />
                <p className="text-sm text-text-secondary">Float</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Pulse Indicator */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Pulse Indicator</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="pulse-indicator">
                <div className="pulse-dot" />
                <div className="pulse-ring" />
              </div>
              <span className="text-text-secondary">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-text-secondary">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="text-text-secondary">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-error" />
              <span className="text-text-secondary">Error</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Form Elements</h2>
          <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <Input placeholder="Enter text..." />
            <Input type="email" placeholder="Email address" />
            <Input type="password" placeholder="Password" />
            <Input disabled placeholder="Disabled input" />
          </div>
        </section>

        <Separator />

        {/* Avatars */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Avatars</h2>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>CD</AvatarFallback>
            </Avatar>
          </div>
        </section>

        <Separator />

        {/* Gradient Text */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">Gradient Text</h2>
          <div className="space-y-2">
            <h1 className="gradient-text text-4xl font-bold">Large Gradient Heading</h1>
            <h2 className="gradient-text text-2xl font-semibold">Medium Gradient Heading</h2>
            <p className="gradient-text text-lg">Gradient text paragraph</p>
          </div>
        </section>
      </div>
    </div>
  );
}
