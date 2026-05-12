import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  ChatConversation,
  ChatMessage,
  ChatTokenEvent,
  ChatDoneEvent,
  ChatErrorEvent,
} from '@/types/chat';

interface ListResponse<T> {
  data?: { conversations?: T[]; messages?: T[] } | null;
}

export function useChat(projectId: number = 6) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hold listener cleanups across re-renders / conversation switches
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  // Safety timeout — clears isStreaming if the SSE connection drops silently
  // before emitting `done` (Issue 3 fix: prevents permanent UI freeze).
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STREAM_TIMEOUT_MS = 120_000;

  const clearStreamTimeout = () => {
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
  };

  // ============================================================================
  // Tauri event subscription — runs once per active conversation
  // ============================================================================
  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    (async () => {
      const tokenUnlisten = await listen<ChatTokenEvent>('chat://token', (event) => {
        if (cancelled || event.payload.conversationId !== activeId) return;
        setStreamingContent((prev) => prev + event.payload.token);
      });

      const doneUnlisten = await listen<ChatDoneEvent>('chat://done', (event) => {
        if (cancelled || event.payload.conversationId !== activeId) return;
        clearStreamTimeout();
        // Materialize the streaming buffer into a real assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: event.payload.messageId,
            conversationId: event.payload.conversationId,
            role: 'assistant',
            content: event.payload.fullContent,
            tokenCount: null,
            createdAt: new Date().toISOString(),
          },
        ]);
        setStreamingContent('');
        setIsStreaming(false);
      });

      const errorUnlisten = await listen<ChatErrorEvent>('chat://error', (event) => {
        if (cancelled || event.payload.conversationId !== activeId) return;
        clearStreamTimeout();
        setError(event.payload.error);
        setStreamingContent('');
        setIsStreaming(false);
      });

      unlistenRefs.current = [tokenUnlisten, doneUnlisten, errorUnlisten];
    })();

    return () => {
      cancelled = true;
      unlistenRefs.current.forEach((un) => un());
      unlistenRefs.current = [];
      clearStreamTimeout();
    };
  }, [activeId]);

  // ============================================================================
  // Load conversation list
  // ============================================================================
  const refreshConversations = useCallback(async () => {
    try {
      const raw = await invoke<ListResponse<ChatConversation>>('list_conversations', {
        projectId,
        limit: 50,
      });
      setConversations(raw.data?.conversations ?? []);
    } catch (e) {
      console.error('failed to list conversations', e);
    }
  }, [projectId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // ============================================================================
  // Load history when active conversation changes
  // ============================================================================
  const loadHistory = useCallback(async (conversationId: string) => {
    try {
      const raw = await invoke<ListResponse<ChatMessage>>('get_history', {
        conversationId,
        limit: 200,
      });
      setMessages(raw.data?.messages ?? []);
      setStreamingContent('');
      setError(null);
    } catch (e) {
      console.error('failed to load history', e);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      loadHistory(activeId);
    } else {
      setMessages([]);
    }
  }, [activeId, loadHistory]);

  // ============================================================================
  // Actions
  // ============================================================================
  const startNewChat = useCallback(
    async (title?: string) => {
      try {
        const conversation = await invoke<ChatConversation>('start_chat', {
          projectId,
          title: title ?? null,
        });
        await refreshConversations();
        setActiveId(conversation.id);
        return conversation;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      }
    },
    [projectId, refreshConversations],
  );

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setError(null);
  }, []);

  /**
   * Send a message. If `conversationIdOverride` is supplied it takes priority
   * over `activeId` — useful for race-free flows like "create chat then send
   * first message" where React state hasn't propagated yet (Issue 6 fix).
   */
  const sendMessage = useCallback(
    async (content: string, conversationIdOverride?: string) => {
      const targetId = conversationIdOverride ?? activeId;
      if (!targetId) {
        setError('No active conversation. Start a new chat first.');
        return;
      }
      if (!content.trim() || isStreaming) return;

      // Optimistic user message
      const optimisticId = -Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversationId: targetId,
          role: 'user',
          content,
          tokenCount: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingContent('');
      setIsStreaming(true);
      setError(null);

      // Issue 3 fix: safety timeout in case SSE drops before `done` fires
      clearStreamTimeout();
      streamTimeoutRef.current = setTimeout(() => {
        setIsStreaming(false);
        setStreamingContent('');
        setError('Response timed out. The connection may have dropped.');
      }, STREAM_TIMEOUT_MS);

      try {
        await invoke('send_message', { conversationId: targetId, content });
        // Tokens arrive via the listener; nothing to do here
      } catch (e) {
        clearStreamTimeout();
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setIsStreaming(false);
        // Drop the optimistic message on hard failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    },
    [activeId, isStreaming],
  );

  return {
    conversations,
    activeId,
    messages,
    streamingContent,
    isStreaming,
    error,
    refreshConversations,
    startNewChat,
    selectConversation,
    sendMessage,
  };
}
