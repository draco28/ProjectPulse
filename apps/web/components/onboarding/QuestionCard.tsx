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
      <Label htmlFor={question.id} className="text-white font-medium">
        {question.questionNumber}. {question.text}
        {question.isRequired && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <Textarea
        id={question.id}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={cn(
          'neu-inset bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500',
          'focus:ring-2 focus:ring-coral-500 focus:border-transparent',
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
