/**
 * Mock Data for Dashboard
 *
 * Sample data for development and testing
 */

export const mockIssues = [
  {
    id: '1',
    title: 'Authentication flow not handling session timeout',
    description:
      'Users are being logged out unexpectedly after 5 minutes of inactivity. Need to implement proper session refresh.',
    priority: 'critical' as const,
    category: 'Authentication',
    isActive: true,
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Add dark mode support for knowledge base',
    description:
      'Knowledge base articles are hard to read in dark environments. Implement theme-aware styling.',
    priority: 'high' as const,
    category: 'UI/UX',
    isActive: false,
    createdAt: '5 hours ago',
  },
  {
    id: '3',
    title: 'Optimize database queries for dashboard',
    description: 'Dashboard is loading slowly (3-4 seconds). Profile and optimize SQL queries.',
    priority: 'medium' as const,
    category: 'Performance',
    isActive: true,
    createdAt: '1 day ago',
  },
  {
    id: '4',
    title: 'Add unit tests for API routes',
    description: 'Increase test coverage for critical API endpoints to prevent regressions.',
    priority: 'medium' as const,
    category: 'Testing',
    isActive: false,
    createdAt: '2 days ago',
  },
  {
    id: '5',
    title: 'Update dependencies to latest versions',
    description: 'Several npm packages are outdated. Review and update to latest stable versions.',
    priority: 'low' as const,
    category: 'Maintenance',
    isActive: false,
    createdAt: '3 days ago',
  },
];

export const mockStats = {
  openIssues: {
    value: 12,
    trend: { value: 8, label: 'from last week' },
  },
  knowledgeItems: {
    value: 47,
    trend: { value: 15, label: 'from last month' },
  },
  securityFindings: {
    value: 3,
    trend: { value: -40, label: 'from last week' },
  },
  completed: {
    value: 28,
    trend: { value: 12, label: 'from last week' },
  },
};

export const mockAgents = [
  {
    id: '1',
    name: 'Code Reviewer',
    description: 'Analyzing pull request #127 for best practices and security issues',
    status: 'active' as const,
    lastActivity: 'Active now',
    avatar: 'CR',
    color: '#00D4FF',
  },
  {
    id: '2',
    name: 'Bug Hunter',
    description: 'Scanning codebase for potential null pointer exceptions',
    status: 'active' as const,
    lastActivity: '2 min ago',
    avatar: 'BH',
    color: '#FF0055',
  },
  {
    id: '3',
    name: 'Security Auditor',
    description: 'Completed security scan - found 3 medium severity issues',
    status: 'idle' as const,
    lastActivity: '15 min ago',
    avatar: 'SA',
    color: '#FFD600',
  },
  {
    id: '4',
    name: 'Test Generator',
    description: 'Last run: Generated 47 unit tests for API module',
    status: 'offline' as const,
    lastActivity: '2 hours ago',
    avatar: 'TG',
    color: '#00FF88',
  },
];
