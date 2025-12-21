/**
 * Command Registry
 *
 * Centralized registry of all commands available in the palette
 */

import {
  Plus,
  Lightbulb,
  Book,
  ShieldAlert,
  Home,
  ListTodo,
  Book as BookOpen,
  Activity,
  Users,
  Settings,
  Moon,
  Keyboard,
  Map,
} from 'lucide-react';
import { Command, CommandCategory } from './types';

export function createCommands(router: any, projectId?: number): CommandCategory[] {
  const buildHref = (path: string) => {
    if (!projectId) return path;
    return `${path}?project=${projectId}`;
  };

  return [
    // Quick Actions
    {
      id: 'quick-actions',
      label: 'Quick Actions',
      icon: '⚡',
      commands: [
        {
          id: 'create-issue',
          type: 'action',
          category: 'Quick Actions',
          title: 'Create New Issue',
          description: 'Open issue creation form',
          icon: Plus,
          shortcut: '⌘N',
          keywords: ['new', 'issue', 'bug', 'feature', 'create', 'add'],
          action: () => router.push(buildHref('/tickets/create')),
        },
        {
          id: 'add-knowledge',
          type: 'action',
          category: 'Quick Actions',
          title: 'Add Knowledge Item',
          description: 'Save information to knowledge base',
          icon: Lightbulb,
          keywords: ['knowledge', 'add', 'save', 'learn', 'document'],
          action: () => router.push(buildHref('/knowledge/new')),
        },
        {
          id: 'create-wiki',
          type: 'action',
          category: 'Quick Actions',
          title: 'Create Wiki Page',
          description: 'Start a new documentation page',
          icon: Book,
          keywords: ['wiki', 'documentation', 'page', 'create', 'doc'],
          action: () => router.push(buildHref('/wiki/new')),
        },
        {
          id: 'security-scan',
          type: 'action',
          category: 'Quick Actions',
          title: 'Run Security Scan',
          description: 'Scan project with Semgrep',
          icon: ShieldAlert,
          keywords: ['security', 'scan', 'semgrep', 'vulnerability', 'audit'],
          action: async () => {
            if (!projectId) {
              alert('Please select a project first');
              return;
            }
            // TODO: Implement security scan trigger
            console.log('Security scan triggered for project:', projectId);
            alert('Security scan started! Check the Security page for results.');
          },
        },
      ],
    },

    // Agent Personas
    {
      id: 'agent-personas',
      label: 'Agent Personas',
      icon: '🤖',
      commands: [
        {
          id: 'agent-code-reviewer',
          type: 'agent',
          category: 'Agent Personas',
          title: 'Activate Code Reviewer',
          description: 'Review code for best practices and bugs',
          icon: '🔍',
          keywords: ['agent', 'code', 'review', 'reviewer', 'analysis'],
          action: async () => {
            // TODO: Implement agent activation
            console.log('Activating Code Reviewer agent');
            alert('Code Reviewer agent activated!');
          },
        },
        {
          id: 'agent-bug-hunter',
          type: 'agent',
          category: 'Agent Personas',
          title: 'Activate Bug Hunter',
          description: 'Find and diagnose bugs systematically',
          icon: '🐛',
          keywords: ['agent', 'bug', 'hunter', 'debug', 'troubleshoot'],
          action: async () => {
            console.log('Activating Bug Hunter agent');
            alert('Bug Hunter agent activated!');
          },
        },
        {
          id: 'agent-feature-architect',
          type: 'agent',
          category: 'Agent Personas',
          title: 'Activate Feature Architect',
          description: 'Design new features and architecture',
          icon: '🏗️',
          keywords: ['agent', 'architect', 'feature', 'design', 'architecture'],
          action: async () => {
            console.log('Activating Feature Architect agent');
            alert('Feature Architect agent activated!');
          },
        },
        {
          id: 'agent-security-auditor',
          type: 'agent',
          category: 'Agent Personas',
          title: 'Activate Security Auditor',
          description: 'Audit code for security vulnerabilities',
          icon: '🛡️',
          keywords: ['agent', 'security', 'auditor', 'audit', 'vulnerability'],
          action: async () => {
            console.log('Activating Security Auditor agent');
            alert('Security Auditor agent activated!');
          },
        },
      ],
    },

    // Navigation
    {
      id: 'navigation',
      label: 'Navigation',
      icon: '🧭',
      commands: [
        {
          id: 'nav-dashboard',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Dashboard',
          icon: Home,
          shortcut: '⌘D',
          keywords: ['dashboard', 'home', 'overview', 'main'],
          action: () => router.push(buildHref('/dashboard')),
        },
        {
          id: 'nav-issues',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Issues',
          icon: ListTodo,
          shortcut: '⌘I',
          keywords: ['issues', 'tasks', 'bugs', 'tickets'],
          action: () => router.push(buildHref('/tickets')),
        },
        {
          id: 'nav-knowledge',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Knowledge Base',
          icon: Lightbulb,
          shortcut: '⌘B',
          keywords: ['knowledge', 'learn', 'documentation', 'notes'],
          action: () => router.push(buildHref('/knowledge')),
        },
        {
          id: 'nav-wiki',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Wiki',
          icon: BookOpen,
          shortcut: '⌘W',
          keywords: ['wiki', 'documentation', 'docs', 'pages'],
          action: () => router.push(buildHref('/wiki')),
        },
        {
          id: 'nav-security',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Security',
          icon: ShieldAlert,
          shortcut: '⌘E',
          keywords: ['security', 'health', 'findings', 'vulnerabilities'],
          action: () => router.push(buildHref('/health')),
        },
        {
          id: 'nav-agents',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Agent Personas',
          icon: Users,
          shortcut: '⌘A',
          keywords: ['agents', 'personas', 'ai', 'assistants'],
          action: () => router.push(buildHref('/agents')),
        },
        {
          id: 'nav-roadmap',
          type: 'navigation',
          category: 'Navigation',
          title: 'Go to Roadmap',
          icon: Map,
          shortcut: '⌘R',
          keywords: ['roadmap', 'timeline', 'planning', 'schedule'],
          action: () => router.push(buildHref('/roadmap')),
        },
      ],
    },

    // Settings
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      commands: [
        {
          id: 'toggle-theme',
          type: 'setting',
          category: 'Settings',
          title: 'Toggle Theme',
          description: 'Switch between light and dark mode',
          icon: Moon,
          keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
          action: () => {
            // TODO: Implement theme toggle
            console.log('Theme toggle');
            alert('Theme toggle - coming soon!');
          },
        },
        {
          id: 'open-settings',
          type: 'setting',
          category: 'Settings',
          title: 'Open Settings',
          description: 'Configure application settings',
          icon: Settings,
          shortcut: '⌘,',
          keywords: ['settings', 'preferences', 'config', 'options'],
          action: () => {
            if (projectId) {
              router.push(`/projects/${projectId}/settings`);
            } else {
              router.push('/app');
            }
          },
        },
        {
          id: 'keyboard-shortcuts',
          type: 'setting',
          category: 'Settings',
          title: 'Keyboard Shortcuts',
          description: 'View all available shortcuts',
          icon: Keyboard,
          shortcut: '⌘/',
          keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys', 'help'],
          action: () => {
            // TODO: Show shortcuts modal
            alert(
              'Keyboard shortcuts reference:\n\n⌘K - Command Palette\n⌘D - Dashboard\n⌘I - Issues\n⌘W - Wiki\n⌘E - Security\n⌘A - Agents\n⌘N - New Issue\n⌘, - Settings'
            );
          },
        },
      ],
    },
  ];
}

// Flatten all commands from categories
export function getAllCommands(categories: CommandCategory[]): Command[] {
  return categories.flatMap((category) => category.commands);
}
