export interface ChatConversation {
  id: string;
  projectId: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

// Tauri event payloads emitted by commands/chat.rs
export interface ChatTokenEvent {
  conversationId: string;
  token: string;
}

export interface ChatDoneEvent {
  conversationId: string;
  messageId: number;
  fullContent: string;
}

export interface ChatErrorEvent {
  conversationId: string;
  error: string;
}
