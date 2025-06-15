
'use server';

/**
 * @fileOverview Provides suggestions for related topics and search queries to enhance understanding of a question.
 *
 * - suggestRelatedTopics - A function that suggests related topics and search queries.
 * - SuggestRelatedTopicsInput - The input type for the suggestRelatedTopics function.
 * - SuggestRelatedTopicsOutput - The return type for the suggestRelatedTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { educationalLevels } from '@/lib/types'; // Import educationalLevels

const SuggestRelatedTopicsInputSchema = z.object({
  question: z.string().describe('The question to find related topics for.'),
  level: z
    .enum(educationalLevels) // Use educationalLevels for consistency
    .describe('The educational level of the question.'),
  subject: z.string().describe('The subject of the question.'),
});
export type SuggestRelatedTopicsInput = z.infer<typeof SuggestRelatedTopicsInputSchema>;

const SuggestRelatedTopicsOutputSchema = z.object({
  topics: z.array(z.string()).describe('List of related topics.'),
  searchQueries: z.array(z.string()).describe('List of suggested search queries.'),
  suitabilityCheckPassed: z.boolean().describe('Whether the suggested materials are suitable or not.'),
});
export type SuggestRelatedTopicsOutput = z.infer<typeof SuggestRelatedTopicsOutputSchema>;

export async function suggestRelatedTopics(input: SuggestRelatedTopicsInput): Promise<SuggestRelatedTopicsOutput> {
  return suggestRelatedTopicsFlow(input);
}

const checkSuitability = ai.defineTool({
  name: 'checkSuitability',
  description: 'Checks if the suggested materials are suitable for the given question.',
  inputSchema: SuggestRelatedTopicsOutputSchema,
  outputSchema: z.boolean(),
},
async (input) => {
  // This can call any typescript function.
  // For now, always return true
  return true;
});

const suggestRelatedTopicsPrompt = ai.definePrompt({
  name: 'suggestRelatedTopicsPrompt',
  input: {schema: SuggestRelatedTopicsInputSchema},
  output: {schema: SuggestRelatedTopicsOutputSchema},
  tools: [checkSuitability],
  prompt: `You are an AI assistant helping students understand questions better.

  Given a question, suggest related topics and search queries that can help the student explore the concepts in more depth.
  The student is at the {{{level}}} level and is studying {{{subject}}}.

  Question: {{{question}}}

  Make sure to check suitability using the checkSuitability tool.
`,
});

const suggestRelatedTopicsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedTopicsFlow',
    inputSchema: SuggestRelatedTopicsInputSchema,
    outputSchema: SuggestRelatedTopicsOutputSchema,
  },
  async input => {
    const {output} = await suggestRelatedTopicsPrompt(input);

    if (output && output.suitabilityCheckPassed) {
      return output;
    } else {
      return {
        topics: [],
        searchQueries: [],
        suitabilityCheckPassed: false,
      };
    }
  }
);
