
'use server';

/**
 * @fileOverview Generates personalized study plans based on student needs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { educationalLevels, type EducationalLevel } from '@/lib/types';

const StudyPlanInputSchema = z.object({
  subject: z.string().describe('The subject to create a study plan for.'),
  level: z.enum(educationalLevels).describe('The educational level.'),
  weakAreas: z.array(z.string()).describe('Topics the student struggles with.'),
  strongAreas: z.array(z.string()).describe('Topics the student is good at.'),
  timeAvailable: z.number().describe('Hours per week available for study.'),
  examDate: z.string().optional().describe('Upcoming exam date if any.'),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).describe('Preferred learning style.'),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

const StudyPlanOutputSchema = z.object({
  plan: z.object({
    overview: z.string().describe('Overview of the study plan'),
    weeklySchedule: z.array(z.object({
      week: z.number(),
      focus: z.string(),
      topics: z.array(z.string()),
      activities: z.array(z.string()),
      timeAllocation: z.string(),
    })),
    resources: z.array(z.object({
      type: z.string(),
      title: z.string(),
      description: z.string(),
    })),
    milestones: z.array(z.object({
      week: z.number(),
      goal: z.string(),
      assessment: z.string(),
    })),
  }),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
  return studyPlanFlow(input);
}

const studyPlanPrompt = ai.definePrompt({
  name: 'studyPlanPrompt',
  input: { schema: StudyPlanInputSchema },
  output: { schema: StudyPlanOutputSchema },
  prompt: `You are an expert educational consultant creating a personalized study plan.

Create a comprehensive study plan for a {{{level}}} student studying {{{subject}}}.

Student Profile:
- Weak areas: {{{weakAreas}}}
- Strong areas: {{{strongAreas}}}
- Available study time: {{{timeAvailable}}} hours per week
- Learning style: {{{learningStyle}}}
{{#if examDate}}
- Exam date: {{{examDate}}}
{{/if}}

Create a structured plan that:
1. Prioritizes weak areas while maintaining strong areas
2. Adapts to the student's learning style
3. Fits within their available time
4. Includes specific activities and resources
5. Sets achievable milestones
6. Provides variety to maintain engagement`,
});

const studyPlanFlow = ai.defineFlow(
  {
    name: 'studyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await studyPlanPrompt(input);
    return output!;
  }
);
