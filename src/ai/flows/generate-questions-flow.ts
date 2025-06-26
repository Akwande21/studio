
'use server';

/**
 * @fileOverview Generates practice questions based on a topic and educational level.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { educationalLevels, type EducationalLevel } from '@/lib/types';

const GenerateQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic to generate questions for.'),
  level: z.enum(educationalLevels).describe('The educational level for the questions.'),
  subject: z.string().describe('The subject context.'),
  questionCount: z.number().min(1).max(10).describe('Number of questions to generate.'),
  questionType: z.enum(['multiple-choice', 'short-answer', 'essay', 'mixed']).describe('Type of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['multiple-choice', 'short-answer', 'essay']),
    options: z.array(z.string()).optional().describe('For multiple choice questions'),
    correctAnswer: z.string().optional().describe('The correct answer or explanation'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    points: z.number().describe('Suggested points for this question'),
  })),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `You are an expert educator creating assessment questions.

Generate {{{questionCount}}} {{{questionType}}} questions about "{{{topic}}}" for {{{level}}} students studying {{{subject}}}.

Guidelines:
- Questions should be appropriate for {{{level}}} level
- Include a mix of difficulty levels (easy, medium, hard)
- For multiple choice, provide 4 options with one correct answer
- For short answer, provide the expected answer
- For essay questions, provide key points that should be covered
- Assign appropriate point values (1-10 points based on complexity)
- Ensure questions test understanding, not just memorization`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuestionsPrompt(input);
    return output!;
  }
);
