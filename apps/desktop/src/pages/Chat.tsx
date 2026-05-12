import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare, AlertCircle } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What are the open issues in this sprint?',
  'Summarize the latest wiki pages.',
  'How does the kanban progress cascade work?',
  'Show me the current architecture overview.',
];

export default function Chat() {
  const {
    conversations,
    activeId,
    messages,
    streamingContent,
    isStreaming,
    error,
    startNewChat,
    selectConversation,
    sendMessage,
  } = useChat(6);


  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  const handleNew = async () => {
    try {
      await startNewChat();
    } catch {
      // error surfaced via hook
    }
  };

  return (
    // Negative margins on top/bottom cancel the AppLayout's p-6, then we re-add
    // horizontal padding so the chat fills the full available height.
    <div className="-mx-6 -my-6 flex h-[calc(100vh)]">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={handleNew}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-700/50">
          <h1 className="text-lg font-semibold text-gray-100">AI Chat</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            PulseHive-powered assistant with RAG-grounded context
          </p>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!activeId ? (
            <div className="flex flex-col items-center justify-center h-full">
              <EmptyState
                icon={MessageSquare}
                title="No active conversation"
                description='Click "New Chat" on the left to start.'
              />
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-xl">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={async () => {
                      try {
                        // Issue 6 fix: pass conversation id directly to avoid stale closure
                        const conv = await startNewChat();
                        await sendMessage(p, conv.id);
                      } catch {
                        // error surfaced via hook
                      }
                    }}
                    className="rounded-lg border border-gray-700/50 bg-surface-raised/60 p-3 text-left text-xs text-gray-400 hover:border-coral/30 hover:text-gray-200 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <EmptyState
              icon={MessageSquare}
              title="Start the conversation"
              description="Type a message below to get started."
            />
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {isStreaming && <StreamingMessage content={streamingContent} />}
            </>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-700/50">
          <ChatInput
            onSubmit={sendMessage}
            disabled={!activeId || isStreaming}
            placeholder={
              !activeId
                ? 'Start a new chat to begin…'
                : isStreaming
                  ? 'Assistant is responding…'
                  : 'Ask anything about this project…'
            }
          />
        </div>
      </main>
    </div>
  );
}
