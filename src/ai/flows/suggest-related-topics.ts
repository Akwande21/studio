
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
  retrievedInformation: z.string().optional().describe('Information retrieved from external sources, if any.'),
});
export type SuggestRelatedTopicsOutput = z.infer<typeof SuggestRelatedTopicsOutputSchema>;

export async function suggestRelatedTopics(input: SuggestRelatedTopicsInput): Promise<SuggestRelatedTopicsOutput> {
  return suggestRelatedTopicsFlow(input);
}

const checkSuitability = ai.defineTool({
  name: 'checkSuitability',
  description: 'Checks if the suggested materials are suitable for the given question, considering the user level and subject.',
  inputSchema: z.object({
    topics: z.array(z.string()),
    searchQueries: z.array(z.string()),
  }),
  outputSchema: z.boolean(),
},
async (input) => {
  // This can call any typescript function.
  // For now, always return true
  console.log("checkSuitability tool called with:", input);
  return true;
});

const getExternalInformation = ai.defineTool(
  {
    name: 'getExternalInformation',
    description: 'Retrieves additional information or context about a specific query or concept from external sources to help formulate better suggestions. Use this if the original question lacks context or to deepen understanding of a sub-topic.',
    inputSchema: z.object({
      query: z.string().describe('The specific concept, term, or question phrase to search for external information on.'),
    }),
    outputSchema: z.string().describe('A summary of the information found from external sources.'),
  },
  async (input) => {
    // In a real application, this would call an external API (e.g., Google Search, Wikipedia).
    // For this mock, we'll return a placeholder.
    console.log(`getExternalInformation tool called with query: "${input.query}"`);
    // Simulate finding some information
    if (input.query.toLowerCase().includes("newton")) {
      return `Retrieved additional context for "${input.query}": Newton's laws of motion are three basic laws of classical mechanics that describe the relationship between the motion of an object and the forces acting on it. This information can be used to generate more specific sub-topics and search queries.`;
    }
    if (input.query.toLowerCase().includes("calculus")) {
        return `Retrieved additional context for "${input.query}": Calculus is the mathematical study of continuous change. Key concepts include limits, derivatives, and integrals. This can help in suggesting foundational topics or advanced applications.`;
    }
    return `Retrieved additional context for "${input.query}": This concept is fundamental to understanding ${SuggestRelatedTopicsInputSchema.shape.subject.description.toLowerCase()}. Consider exploring its applications and historical development.`;
  }
);

const suggestRelatedTopicsPrompt = ai.definePrompt({
  name: 'suggestRelatedTopicsPrompt',
  input: {schema: SuggestRelatedTopicsInputSchema},
  output: {schema: SuggestRelatedTopicsOutputSchema},
  tools: [checkSuitability, getExternalInformation], // Added getExternalInformation tool
  prompt: `You are an AI assistant helping students understand questions better.

  Given a question, the student's educational level, and the subject:
  1. Evaluate the question: {{{question}}} for a {{{level}}} student studying {{{subject}}}.
  2. If you determine that more context or information about specific terms or concepts within the question would help generate better suggestions, use the "getExternalInformation" tool. Provide the core concept or term as the query to the tool.
  3. Based on the original question, and any information retrieved from "getExternalInformation", suggest a list of related topics and a list of specific search queries. These should help the student explore the concepts in more depth.
  4. The suggestions should be tailored to the student's educational level ({{{level}}}) and subject ({{{subject}}}).
  5. After generating topics and search queries, use the "checkSuitability" tool to verify if your generated topics and search queries are appropriate for the student.
  6. If external information was retrieved, include it in the 'retrievedInformation' field of your output. If no external information was sought or found, omit this field or leave it empty.
  7. If the suitability check passes, provide the topics and search queries. Otherwise, indicate that suitable materials could not be found.

  Question: {{{question}}}
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
      return output; // Output already includes retrievedInformation if populated by the LLM
    } else {
      return {
        topics: [],
        searchQueries: [],
        suitabilityCheckPassed: false,
        retrievedInformation: output?.retrievedInformation, // Pass through if suitability failed but info was fetched
      };
    }
  }
);
