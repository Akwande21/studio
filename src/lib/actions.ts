
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { addComment as addMockComment, toggleBookmark as toggleMockBookmark, submitRating as submitMockRating, getPaperById, addUploadedPaper as addMockUploadedPaper } from './data';
import type { Paper, EducationalLevel } from './types'; // Changed import
import { educationalLevels } from './types'; // Added import
import { z } from 'zod';

export async function handleSuggestRelatedTopics(
  questionText: string,
  level: EducationalLevel, // Changed type
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
    return { success: true, isBookmarked };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function handleSubmitRating(paperId: string, userId: string, value: number) {
  try {
    const rating = await submitMockRating(paperId, userId, value);
    const updatedPaper = await getPaperById(paperId); 
    return { success: true, rating, averageRating: updatedPaper?.averageRating, ratingsCount: updatedPaper?.ratingsCount };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

const paperUploadSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  level: z.enum(educationalLevels), // Changed here
  subject: z.string(),
  year: z.coerce.number(),
  file: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "File is required") // Check if FileList, then check specific file
    .transform(fileList => fileList[0]) // Get the first file
    .refine(file => file instanceof File, "Valid file is required"),
});


export async function handlePaperUpload(formData: FormData) {
  try {
    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      // Pass the File object directly for Zod validation
      file: formData.get('file') instanceof File ? formData.get('file') : undefined,
    };
    
    // For Zod to correctly parse FormData with a file, we need to handle it carefully.
    // The schema expects `file` to be a single `File` instance, not a `FileList`.
    // We'll adjust the schema slightly to expect a FileList and then refine it.
    
    const fileListSchema = z.object({
      file: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    });

    const validatedData = paperUploadSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      file: formData.get('file'), // Pass the raw File object
    });


    if (!validatedData.success) {
      console.error("Validation errors:", validatedData.error.flatten().fieldErrors);
      return { success: false, message: "Invalid form data.", errors: validatedData.error.flatten().fieldErrors };
    }
    
    const { title, description, level, subject, year, file } = validatedData.data;

    const fileName = file.name.replace(/\s+/g, '_');
    const mockDownloadUrl = `/papers/uploads/mock_${Date.now()}_${fileName}`;

    const newPaperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'isBookmarked'> & { downloadUrl: string } = {
      title,
      description,
      level, // type is now EducationalLevel
      subject,
      year,
      downloadUrl: mockDownloadUrl,
    };

    const newPaper = await addMockUploadedPaper(newPaperData);
    return { success: true, paper: newPaper };

  } catch (error) {
    console.error("Error in handlePaperUpload:", error);
    // If ZodError, extract messages
    if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
    }
    return { success: false, message: "An unexpected error occurred during paper upload." };
  }
}
