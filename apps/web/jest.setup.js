// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Note: Environment variables are loaded in jest.config.js BEFORE modules are resolved
// This ensures DATABASE_URL is available for Prisma client initialization

// ============================================================================
// Web API polyfills for Next.js server components testing
// Required for testing files that import from 'next/server' (NextRequest, NextResponse)
// Note: TextEncoder/TextDecoder are set up in jest.setup.globals.js (runs first)
// ============================================================================

// Web APIs from undici for Next.js server testing
import { Request, Response, Headers, FormData, Blob, File } from 'undici';

// Assign Web APIs to global scope
Object.assign(global, { Request, Response, Headers, FormData, Blob, File });

// Mock Next.js revalidation functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock Next.js navigation (used by hooks and components)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock next-auth to avoid jose ESM import issues in Node test environment.
// jose@4.x ships ESM-only browser builds that Jest/jsdom can't transform.
// The mock provides the default export (NextAuth function) and named exports.
const mockNextAuth = jest.fn(() => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
mockNextAuth.getServerSession = jest.fn(() => Promise.resolve(null));
jest.mock('next-auth', () => ({
  __esModule: true,
  default: mockNextAuth,
  getServerSession: jest.fn(() => Promise.resolve(null)),
  NextAuthOptions: {},
}));
jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: mockNextAuth,
  getServerSession: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'credentials', name: 'Credentials' })),
}));

// Mock react-syntax-highlighter to avoid ESM issues
jest.mock('react-syntax-highlighter/dist/esm/light', () => {
  return function MockSyntaxHighlighter({ children }) {
    return children;
  };
});

// Mock all language imports from react-syntax-highlighter
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/typescript', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/javascript', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/json', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/bash', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/markdown', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/css', () => ({ default: {} }));
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/python', () => ({ default: {} }));

// Global fetch polyfill for Node environment
global.fetch = jest.fn();

// Mock auth validation for API route tests.
// Routes use getAuthorizedProjectId() which requires auth headers.
// Tests that need specific auth behavior can override this mock.
jest.mock('@/lib/auth/validateRequest', () => ({
  getAuthorizedProjectId: jest.fn((_req, projectId) =>
    Promise.resolve({ projectId: projectId || 999 })
  ),
  AuthError: class AuthError extends Error {
    constructor(message, statusCode = 401) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

// Mock Clipboard API for component tests (only in jsdom/browser environment)
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn(() => Promise.resolve()),
    },
    writable: true,
    configurable: true,
  });
}

// Mock localStorage for component tests (only in jsdom/browser environment)
let localStorageStore = {};

// Reset state between tests to prevent test pollution
beforeEach(() => {
  localStorageStore = {};
  jest.clearAllMocks();
});

// Define mock functions that persist across test runs (only in jsdom/browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: jest.fn((key) => localStorageStore[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageStore[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete localStorageStore[key];
      }),
      clear: jest.fn(() => {
        localStorageStore = {};
      }),
      length: 0,
      key: jest.fn(),
    },
    writable: true,
    configurable: true,
  });
}

// Ensure Prisma disconnects after all tests (prevents open handle warnings)
afterAll(async () => {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // Prisma not used in this test suite, ignore
  }
});
