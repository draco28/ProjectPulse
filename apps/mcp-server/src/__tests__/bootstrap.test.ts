import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.js';

test('loadConfig applies defaults when env unset', () => {
  const result = loadConfig({});
  assert.equal(result.apiBaseUrl, 'http://localhost:3000');
  assert.equal(result.logLevel, 'info');
});

test('loadConfig respects overrides', () => {
  const result = loadConfig({
    apiBaseUrl: 'http://example.com',
    logLevel: 'debug',
  });

  assert.equal(result.apiBaseUrl, 'http://example.com');
  assert.equal(result.logLevel, 'debug');
});
