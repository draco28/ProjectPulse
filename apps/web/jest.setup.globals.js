/**
 * Jest Setup: Global Polyfills
 *
 * This file runs BEFORE jest.setup.js via setupFiles config.
 * It provides Web API globals needed by undici and next/server.
 */

// TextEncoder/TextDecoder are required by undici
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Stream APIs required by undici
const { ReadableStream, TransformStream, WritableStream } = require('stream/web');
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.WritableStream = WritableStream;

// MessageChannel/MessagePort required by undici
const { MessageChannel, MessagePort } = require('worker_threads');
global.MessageChannel = MessageChannel;
global.MessagePort = MessagePort;

// BroadcastChannel mock for undici
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
  onmessage = null;
  onmessageerror = null;
};
