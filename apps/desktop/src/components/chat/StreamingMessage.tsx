interface StreamingMessageProps {
  content: string;
}

/**
 * In-progress assistant response. Renders with a blinking cursor at the end
 * so the user sees the model "typing". Once the stream completes, the parent
 * replaces this with a regular ChatMessage.
 */
export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-surface-raised border border-gray-700/40 text-gray-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-medium text-gray-400">Assistant</span>
          <span className="text-xs text-coral animate-pulse">typing…</span>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {content || <span className="text-gray-500 italic">Thinking…</span>}
          {content && <span className="inline-block w-2 h-4 ml-0.5 bg-coral align-text-bottom animate-pulse" />}
        </div>
      </div>
    </div>
  );
}
