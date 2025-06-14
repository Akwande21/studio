
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { addComment as addMockComment, toggleBookmark as toggleMockBookmark, submitRating as submitMockRating, getPaperById, addUploadedPaper as addMockUploadedPaper } from './data';
import type { Paper, PaperLevel } from './types';
import { z } from 'zod';

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

const paperUploadSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  level: z.enum(["High School", "College", "University"]),
  subject: z.string(),
  year: z.coerce.number(),
  file: z.instanceof(File),
});

export async function handlePaperUpload(formData: FormData) {
  try {
    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      file: formData.get('file'),
    };

    const validatedData = paperUploadSchema.safeParse(rawFormData);

    if (!validatedData.success) {
      console.error("Validation errors:", validatedData.error.flatten().fieldErrors);
      return { success: false, message: "Invalid form data.", errors: validatedData.error.flatten().fieldErrors };
    }
    
    const { title, description, level, subject, year, file } = validatedData.data;

    // Simulate file saving and URL generation
    // In a real app, upload to cloud storage (e.g., Firebase Storage) and get the URL
    const fileName = file.name.replace(/\s+/g, '_');
    const mockDownloadUrl = `/papers/uploads/mock_${Date.now()}_${fileName}`;

    const newPaperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'isBookmarked'> & { downloadUrl: string } = {
      title,
      description,
      level,
      subject,
      year,
      downloadUrl: mockDownloadUrl,
    };

    const newPaper = await addMockUploadedPaper(newPaperData);
    // In a real app: revalidatePath('/'); revalidatePath('/admin/upload'); // Or wherever relevant
    return { success: true, paper: newPaper };

  } catch (error) {
    console.error("Error in handlePaperUpload:", error);
    return { success: false, message: "An unexpected error occurred during paper upload." };
  }
}
