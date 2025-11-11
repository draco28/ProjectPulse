/**
 * Integration test for Wiki Detail Page
 * Tests complete page rendering with all child components
 */

import { render, screen, within } from '@testing-library/react';
import WikiPage from '../page';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wikiPage: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/wiki/getting-started'),
}));

// Mock child components to simplify integration test
jest.mock('@/components/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('@/components/FloatingBackground', () => ({
  FloatingBackground: () => <div data-testid="floating-bg">Background</div>,
}));

jest.mock('@/components/wiki/WikiHeader', () => ({
  WikiHeader: ({ title, description, category, tags }: any) => (
    <div data-testid="wiki-header" role="region" aria-label="wiki page header">
      <h1>{title}</h1>
      <p>{description}</p>
      <span>{category}</span>
      {tags?.map((tag: string) => <span key={tag}>{tag}</span>)}
    </div>
  ),
}));

jest.mock('@/components/wiki/QuickNavigation', () => ({
  QuickNavigation: ({ categories }: any) => (
    <div data-testid="quick-nav">
      {categories?.map((cat: any) => (
        <div key={cat.slug}>
          <span>{cat.name}</span>
          <span>{cat.count}</span>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/wiki/WikiContent', () => ({
  WikiContent: ({ content, tocItems }: any) => (
    <div data-testid="wiki-content">
      {tocItems?.map((item: any) => <h2 key={item.id}>{item.text}</h2>)}
      <div role="code">{content}</div>
    </div>
  ),
}));

jest.mock('@/components/wiki/WikiContributors', () => ({
  WikiContributors: ({ contributors, views, revisions }: any) => (
    <div data-testid="wiki-contributors">
      {contributors?.map((c: any) => (
        <div key={c.name}>
          <span>{c.name}</span>
          <span>{c.role}</span>
        </div>
      ))}
      <span>{views}</span>
      <span>{revisions}</span>
    </div>
  ),
}));

jest.mock('@/components/wiki/WikiFooterNav', () => ({
  WikiFooterNav: ({ prevPage, nextPage }: any) => (
    <div data-testid="wiki-footer-nav">
      {prevPage && <span>{prevPage.title}</span>}
      {nextPage && <span>{nextPage.title}</span>}
    </div>
  ),
}));

describe('Wiki Detail Page Integration', () => {
  const mockWikiPage = {
    id: 1,
    title: 'Getting Started with ProjectPulse',
    content: `# Introduction

This is a comprehensive guide to getting started.

## Installation

Follow these steps to install:

\`\`\`bash
npm install projectpulse
\`\`\`

## Configuration

Configure your project:

\`\`\`typescript
const config = {
  api: 'https://api.example.com'
};
\`\`\``,
    excerpt: 'Learn how to get started with ProjectPulse',
    category: 'Getting Started',
    path: '/getting-started',
    views: 1250,
    revisions: 5,
    contributors: JSON.stringify([
      { name: 'Alice Smith', avatar: 'https://example.com/alice.jpg', role: 'Author' },
      { name: 'Bob Johnson', avatar: null, role: 'Contributor' },
    ]),
    readingTime: 5,
    tags: JSON.stringify(['quickstart', 'tutorial', 'beginner']),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-11-10T00:00:00Z'),
  };

  const mockPrevPage = {
    title: 'Welcome to Wiki',
    path: '/welcome',
  };

  const mockNextPage = {
    title: 'Advanced Topics',
    path: '/advanced',
  };

  const mockCategories = [
    { name: 'Getting Started', slug: 'getting-started', count: 5, icon: 'Rocket' },
    { name: 'Guides', slug: 'guides', count: 12, icon: 'BookOpen' },
    { name: 'API Documentation', slug: 'api-documentation', count: 8, icon: 'Code' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma findUnique (main page data)
    (prisma.wikiPage.findUnique as jest.Mock).mockResolvedValue(mockWikiPage);

    // Mock Prisma findFirst for prev/next pages
    (prisma.wikiPage.findFirst as jest.Mock)
      .mockResolvedValueOnce(mockPrevPage) // First call: prevPage
      .mockResolvedValueOnce(mockNextPage); // Second call: nextPage

    // Mock Prisma groupBy for categories
    (prisma.wikiPage.groupBy as jest.Mock).mockResolvedValue([
      { category: 'Getting Started', _count: { id: 5 } },
      { category: 'Guides', _count: { id: 12 } },
      { category: 'API Documentation', _count: { id: 8 } },
    ]);
  });

  describe('Full page rendering', () => {
    it('should render all major sections of the wiki page', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify layout components
      expect(screen.getByTestId('floating-bg')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();

      // Verify breadcrumb navigation
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByText('Wiki')).toBeInTheDocument();
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();

      // Verify main content sections exist
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();
      expect(screen.getByText(/learn how to get started/i)).toBeInTheDocument();
    });

    it('should render WikiHeader with correct props', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify title is rendered
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();

      // Verify description/excerpt
      expect(screen.getByText(/learn how to get started/i)).toBeInTheDocument();

      // Verify category
      expect(screen.getByText('Getting Started')).toBeInTheDocument();

      // Verify tags (if rendered by WikiHeader)
      expect(screen.getByText('quickstart')).toBeInTheDocument();
      expect(screen.getByText('tutorial')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });

    it('should render WikiContent with markdown', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify headings from markdown are rendered
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();

      // Verify code blocks are rendered
      const codeBlocks = screen.getAllByRole('code');
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it('should render WikiContributors sidebar', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify contributors are rendered
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Verify stats
      expect(screen.getByText(/1250/)).toBeInTheDocument(); // views
      expect(screen.getByText(/5/)).toBeInTheDocument(); // revisions
    });

    it('should render WikiFooterNav with prev/next links', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify prev/next navigation
      expect(screen.getByText('Welcome to Wiki')).toBeInTheDocument();
      expect(screen.getByText('Advanced Topics')).toBeInTheDocument();
    });

    it('should render QuickNavigation with categories', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify category sidebar
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Guides')).toBeInTheDocument();
      expect(screen.getByText('API Documentation')).toBeInTheDocument();

      // Verify counts
      expect(screen.getByText('5')).toBeInTheDocument(); // Getting Started count
      expect(screen.getByText('12')).toBeInTheDocument(); // Guides count
      expect(screen.getByText('8')).toBeInTheDocument(); // API count
    });
  });

  describe('Data flow validation', () => {
    it('should pass correct props to WikiHeader', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify WikiHeader receives all necessary data
      const header = screen.getByRole('region', { name: /wiki.*header/i });
      within(header).getByText('Getting Started with ProjectPulse');
      within(header).getByText(/learn how to get started/i);
      within(header).getByText('Getting Started'); // category
    });

    it('should pass correct contributors data', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify contributors parsed correctly from JSON
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Verify roles if rendered
      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('Contributor')).toBeInTheDocument();
    });

    it('should parse tags correctly from JSON', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify all tags rendered
      expect(screen.getByText('quickstart')).toBeInTheDocument();
      expect(screen.getByText('tutorial')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });

    it('should extract TOC from markdown content', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Verify TOC includes headings
      // (TOC component should render these as links)
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });

  describe('Database queries', () => {
    it('should query wiki page by slug path', async () => {
      await WikiPage({ params: { slug: 'getting-started' } });

      expect(prisma.wikiPage.findUnique).toHaveBeenCalledWith({
        where: { path: '/getting-started' },
        select: expect.objectContaining({
          id: true,
          title: true,
          content: true,
          excerpt: true,
          category: true,
        }),
      });
    });

    it('should query prev/next pages in same category', async () => {
      await WikiPage({ params: { slug: 'getting-started' } });

      // Verify prev page query
      expect(prisma.wikiPage.findFirst).toHaveBeenCalledWith({
        where: {
          category: 'Getting Started',
          id: { lt: 1 },
        },
        orderBy: { id: 'desc' },
        select: { title: true, path: true },
      });

      // Verify next page query
      expect(prisma.wikiPage.findFirst).toHaveBeenCalledWith({
        where: {
          category: 'Getting Started',
          id: { gt: 1 },
        },
        orderBy: { id: 'asc' },
        select: { title: true, path: true },
      });
    });

    it('should query category statistics', async () => {
      await WikiPage({ params: { slug: 'getting-started' } });

      expect(prisma.wikiPage.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        _count: { id: true },
        where: { category: { not: null } },
      });
    });
  });

  describe('Error handling', () => {
    it('should call notFound() when page does not exist', async () => {
      (prisma.wikiPage.findUnique as jest.Mock).mockResolvedValue(null);

      const { notFound } = await import('next/navigation');

      await WikiPage({ params: { slug: 'non-existent' } });

      expect(notFound).toHaveBeenCalled();
    });

    it('should handle missing prev/next pages gracefully', async () => {
      (prisma.wikiPage.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No prev page
        .mockResolvedValueOnce(null); // No next page

      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Page should still render without errors
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();
    });

    it('should handle empty contributors array', async () => {
      (prisma.wikiPage.findUnique as jest.Mock).mockResolvedValue({
        ...mockWikiPage,
        contributors: JSON.stringify([]),
      });

      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Page should still render
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();
    });

    it('should handle invalid JSON in contributors field', async () => {
      (prisma.wikiPage.findUnique as jest.Mock).mockResolvedValue({
        ...mockWikiPage,
        contributors: 'invalid-json',
      });

      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      // Page should still render (Zod validation should handle this)
      expect(screen.getByText('Getting Started with ProjectPulse')).toBeInTheDocument();
    });
  });

  describe('SEO and metadata', () => {
    it('should include breadcrumb navigation for SEO', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumb).toBeInTheDocument();

      // Verify breadcrumb structure
      const list = within(breadcrumb).getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should include aria-current on current page breadcrumb', async () => {
      const Component = await WikiPage({ params: { slug: 'getting-started' } });
      render(Component);

      const currentPage = screen.getByText('Getting Started with ProjectPulse').closest('li');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });
});
