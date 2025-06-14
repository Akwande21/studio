'use server';
/**
 * @fileOverview Development server entry point for Genkit flows.
 * This file imports all flow definitions to make them available to the Genkit
 * development server. It previously also handled explicit .env loading,
 * which is now removed to rely on Next.js's built-in environment variable handling.
 */

// Removed explicit dotenv import and config() call.
// Next.js handles .env files automatically.

import '@/ai/flows/suggest-related-topics.ts';
