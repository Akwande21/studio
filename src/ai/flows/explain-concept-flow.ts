'use server';
/**
 * @fileOverview Provides an AI-powered explanation for a given concept.
 *
 * - explainConcept - A function that explains a concept.
 * - ExplainConceptInput - The input type for the explainConcept function.
 * - ExplainConceptOutput - The return type for the explainConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { paperLevels, type PaperLevel } from '@/lib/types';

const ExplainConceptInputSchema = z.object({
  concept: z.string().describe('The concept or term to be explained.'),
  level: z.enum(paperLevels).describe('The educational level of the target audience.'),
  subject: z.string().describe('The subject context for the explanation.'),
});
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;

const ExplainConceptOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the concept.'),
});
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;

export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return explainConceptFlow(input);
}

const explainConceptPrompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: {schema: ExplainConceptInputSchema},
  output: {schema: ExplainConceptOutputSchema},
  prompt: `You are an expert educator. Explain the concept "{{{concept}}}" clearly and concisely for a {{{level}}} student studying {{{subject}}}.
Focus on the core meaning and provide a simple example if it helps understanding. Avoid jargon where possible or explain it if necessary.`,
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const {output} = await explainConceptPrompt(input);
    return output!;
  }
);
