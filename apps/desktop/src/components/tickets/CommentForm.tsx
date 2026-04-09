import { useState } from 'react';
import { Send } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}

export function CommentForm({ onSubmit, isSubmitting }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={2}
        className="flex-1 rounded-lg bg-surface-raised border border-gray-700/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-coral/50 transition-colors"
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="self-end rounded-lg bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
