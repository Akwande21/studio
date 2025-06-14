"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { addComment as addMockComment, toggleBookmark as toggleMockBookmark, submitRating as submitMockRating, getPaperById } from './data';
import type { PaperLevel } from './types';

export async function handleSuggestRelatedTopics(
  questionText: string,
  level: PaperLevel,
  subject: string
): Promise<SuggestRelatedTopicsOutput> {
  try {
    const input: SuggestRelatedTopicsInput = {
      question: questionText,
      level,
      subject,
    };
    const result = await suggestRelatedTopicsFlow(input);
    return result;
  } catch (error) {
    console.error("Error in handleSuggestRelatedTopics:", error);
    return {
      topics: [],
      searchQueries: [],
      suitabilityCheckPassed: false,
    };
  }
}

export async function handleAddComment(paperId: string, userId: string, text: string) {
  // Simulate revalidation or data update
  // In a real app: revalidatePath(`/papers/${paperId}`);
  try {
    const comment = await addMockComment(paperId, userId, text);
    return { success: true, comment };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function handleToggleBookmark(paperId: string, userId: string) {
  try {
    const isBookmarked = await toggleMockBookmark(paperId, userId);
     // In a real app: revalidatePath(`/papers/${paperId}`); revalidatePath(`/bookmarks`);
    return { success: true, isBookmarked };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function handleSubmitRating(paperId: string, userId: string, value: number) {
  try {
    const rating = await submitMockRating(paperId, userId, value);
    const updatedPaper = await getPaperById(paperId); // Fetch updated paper to get new average
    // In a real app: revalidatePath(`/papers/${paperId}`);
    return { success: true, rating, averageRating: updatedPaper?.averageRating, ratingsCount: updatedPaper?.ratingsCount };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
