import type { ChatMessage as Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-coral/20 border border-coral/30 text-gray-100'
            : 'bg-surface-raised border border-gray-700/40 text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-medium text-gray-400">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-600">{timeAgo(message.createdAt)}</span>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
      </div>
    </div>
  );
}
