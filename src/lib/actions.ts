
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { addComment as addMockComment, toggleBookmark as toggleMockBookmark, submitRating as submitMockRating, getPaperById, addUploadedPaper as addMockUploadedPaper, loginUser } from './data';
import type { Paper, EducationalLevel } from './types'; 
import { educationalLevels } from './types'; 
import { z } from 'zod';

export async function handleSuggestRelatedTopics(
  questionText: string,
  level: EducationalLevel, 
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
  level: z.enum(educationalLevels), 
  subject: z.string(),
  year: z.coerce.number(),
  file: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "File is required") 
    .transform(fileList => fileList[0]) 
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
      file: formData.get('file') instanceof File ? formData.get('file') : undefined,
    };
    
    const fileListSchema = z.object({
      file: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    });

    const validatedData = paperUploadSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      file: formData.get('file'), 
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
      level, 
      subject,
      year,
      downloadUrl: mockDownloadUrl,
    };

    const newPaper = await addMockUploadedPaper(newPaperData);
    return { success: true, paper: newPaper };

  } catch (error) {
    console.error("Error in handlePaperUpload:", error);
    if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
    }
    return { success: false, message: "An unexpected error occurred during paper upload." };
  }
}

export async function handleForgotPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
  if (!email || !z.string().email().safeParse(email).success) {
    return { success: false, message: "Please enter a valid email address." };
  }
  try {
    // We use loginUser to check if the user exists, but we don't log them in.
    const userExists = await loginUser(email); 
    // Regardless of whether the user exists, we return a generic message
    // to prevent email enumeration attacks.
    return { 
      success: true, 
      message: "If an account with that email exists, instructions to reset your password have been sent. Please check your inbox (and spam folder)." 
    };
  } catch (error) {
    console.error("Error in handleForgotPasswordRequest:", error);
    // Still return a generic message in case of an unexpected error during lookup.
    return { 
      success: true, // From the user's perspective, the action was "processed".
      message: "If an account with that email exists, instructions to reset your password have been sent. Please check your inbox (and spam folder)." 
    };
  }
}

export async function handleResetPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  // Input validation (basic)
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  // In a real application, you would:
  // 1. Validate the reset token (passed as an argument, typically from URL).
  // 2. Find the user associated with the token.
  // 3. Hash the newPassword.
  // 4. Update the user's password in the database.
  // 5. Invalidate the reset token.

  // For this mock, we'll just simulate success.
  console.log(`Mock password reset: New password would be "${newPassword}"`);
  
  // Simulate a short delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return { success: true, message: "Your password has been successfully reset. You can now sign in with your new password." };
}
