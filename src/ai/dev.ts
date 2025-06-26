'use server';
/**
 * @fileOverview Development server entry point for Genkit flows.
 * This file imports all flow definitions to make them available to the Genkit
 * development server. Next.js handles .env files automatically.
 */

import '@/ai/flows/suggest-related-topics.ts';
import '@/ai/flows/explain-concept-flow.ts';
import '@/ai/flows/generate-questions-flow.ts';
import '@/ai/flows/study-plan-flow.ts';
