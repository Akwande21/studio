"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Question as QuestionType, PaperLevel, StudySuggestion } from '@/lib/types';
import { handleSuggestRelatedTopics } from '@/lib/actions';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Lightbulb, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AiStudyToolClientProps {
  question: QuestionType;
  paperLevel: PaperLevel;
  paperSubject: string;
}

export function AiStudyToolClient({ question, paperLevel, paperSubject }: AiStudyToolClientProps) {
  const [suggestions, setSuggestions] = useState<StudySuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchSuggestions = () => {
    setError(null);
    setSuggestions(null);
    startTransition(async () => {
      try {
        const result = await handleSuggestRelatedTopics(question.text, paperLevel, paperSubject);
        if (result.suitabilityCheckPassed && (result.topics.length > 0 || result.searchQueries.length > 0)) {
          setSuggestions({ topics: result.topics, searchQueries: result.searchQueries });
        } else if (!result.suitabilityCheckPassed) {
          setError("AI couldn't find suitable related materials for this question at the moment.");
          toast({
            title: "Suggestions Unavailable",
            description: "Suitable supplementary materials could not be located.",
            variant: "default"
          });
        } else {
           setError("No specific suggestions found. Try rephrasing or check back later.");
        }
      } catch (e) {
        console.error("AI Study Tool Error:", e);
        setError("An error occurred while fetching suggestions. Please try again.");
        toast({
          title: "Error",
          description: "Failed to fetch AI suggestions.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Card className="mt-6 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <Lightbulb className="mr-2 h-6 w-6 text-primary" />
          AI Study Helper
        </CardTitle>
        <CardDescription>Get AI-powered suggestions to understand this question better.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchSuggestions} disabled={isPending} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
          {isPending ? (
            <>
              <LoadingSpinner size={20} className="mr-2" />
              Generating Ideas...
            </>
          ) : (
            "Suggest Related Topics"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions && (
          <div className="mt-6 space-y-4 animate-in fade-in duration-500">
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
               <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
              <AlertTitle className="font-semibold text-green-800 dark:text-green-200">Suggestions Found!</AlertTitle>
              <AlertDescription>
                Here are some topics and queries to explore:
              </AlertDescription>
            </Alert>

            {suggestions.topics.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Related Topics:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                  {suggestions.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestions.searchQueries.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Suggested Search Queries:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {suggestions.searchQueries.map((query, index) => (
                    <li key={index} className="flex items-center">
                        <Search className="h-3.5 w-3.5 mr-2 text-primary/70"/> 
                        <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                        >
                            {query}
                        </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
