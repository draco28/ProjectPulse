import { Plus, MessageSquare } from 'lucide-react';
import type { ChatConversation } from '@/types/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: ConversationListProps) {
  return (
    <aside className="flex flex-col w-64 h-full bg-surface-raised border-r border-gray-700/50">
      <div className="p-3 border-b border-gray-700/50">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-6 px-4">
            No conversations yet. Click "New Chat" to start.
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                activeId === conv.id
                  ? 'bg-coral/15 text-coral-light'
                  : 'text-gray-300 hover:bg-surface-hover'
              }`}
            >
              <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-70" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{conv.title ?? 'Untitled chat'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{timeAgo(conv.updatedAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
