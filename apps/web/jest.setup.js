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

// Mock Clipboard API for component tests
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
  configurable: true,
});

// Mock localStorage for component tests
let localStorageStore = {};

// Reset state between tests to prevent test pollution
beforeEach(() => {
  localStorageStore = {};
  jest.clearAllMocks();
});

// Define mock functions that persist across test runs
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

// Ensure Prisma disconnects after all tests (prevents open handle warnings)
afterAll(async () => {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // Prisma not used in this test suite, ignore
  }
});
