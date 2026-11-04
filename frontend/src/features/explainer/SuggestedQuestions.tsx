import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';

export interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  isLoading?: boolean;
}

export const SUGGESTED_TACTICAL_QUESTIONS = [
  'Why is the fielder positioned at deep cover?',
  'Why did the captain move mid-off?',
  'What is the bowler trying to achieve with this field?',
  'Which scoring areas are being protected?',
  'What areas appear relatively exposed?',
  'How has the field changed compared with the previous delivery?',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  isLoading = false,
}) => {
  return (
    <Card variant="default" className="p-4 space-y-3">
      <CardHeader className="p-0 pb-2 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-blue" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Suggested Tactical Questions
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-1.5">
        {SUGGESTED_TACTICAL_QUESTIONS.map((question, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => onSelectQuestion(question)}
            className="w-full text-left p-2.5 rounded-lg bg-surface-elevated/60 hover:bg-surface-elevated border border-surface-border text-xs text-content-secondary hover:text-content-primary transition-all duration-150 flex items-center justify-between group disabled:opacity-50"
          >
            <span className="truncate pr-2">{question}</span>
            <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

