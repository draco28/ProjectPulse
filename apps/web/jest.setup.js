// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

global.localStorage = localStorageMock;
