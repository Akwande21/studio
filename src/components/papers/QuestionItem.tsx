"use client";

import { useState } from 'react';
import type { Question, PaperLevel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiStudyToolClient } from './AiStudyToolClient';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface QuestionItemProps {
  question: Question;
  index: number;
  paperLevel: PaperLevel;
  paperSubject: string;
}

export function QuestionItem({ question, index, paperLevel, paperSubject }: QuestionItemProps) {
  const [showAiTool, setShowAiTool] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card className="mb-4 shadow-sm">
      <CardHeader className="flex flex-row justify-between items-center p-4">
        <CardTitle className="text-md font-semibold font-body">Question {index + 1}</CardTitle>
        <div className="flex gap-2">
          {question.answer && (
            <Button variant="outline" size="sm" onClick={() => setShowAnswer(!showAnswer)}>
              {showAnswer ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAiTool(!showAiTool)} className="bg-accent/10 hover:bg-accent/20 text-accent-foreground">
            <HelpCircle className="mr-2 h-4 w-4" />
            {showAiTool ? 'Hide AI Helper' : 'AI Study Helper'}
            {showAiTool ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-foreground whitespace-pre-wrap">{question.text}</p>
        {showAnswer && question.answer && (
          <div className="mt-3 p-3 bg-secondary rounded-md">
            <p className="text-sm font-semibold text-secondary-foreground">Answer:</p>
            <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{question.answer}</p>
          </div>
        )}
        {showAiTool && (
          <AiStudyToolClient question={question} paperLevel={paperLevel} paperSubject={paperSubject} />
        )}
      </CardContent>
    </Card>
  );
}
