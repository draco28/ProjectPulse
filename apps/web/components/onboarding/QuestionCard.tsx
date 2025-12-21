/**
 * QuestionCard Component
 *
 * Individual question with textarea input and validation
 */

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: {
    id: string;
    questionNumber: number;
    text: string;
    placeholder: string;
    isRequired: boolean;
  };
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function QuestionCard({ question, value, onChange, error }: QuestionCardProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={question.id} className="font-medium text-white">
        {question.questionNumber}. {question.text}
        {question.isRequired && <span className="ml-1 text-red-400">*</span>}
      </Label>
      <Textarea
        id={question.id}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={cn(
          'neu-inset border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500',
          'focus:ring-coral-500 focus:border-transparent focus:ring-2',
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
