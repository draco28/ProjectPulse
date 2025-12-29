// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Load test environment variables
// For Mac mini integration tests that need DATABASE_URL
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '.env.test') });

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
