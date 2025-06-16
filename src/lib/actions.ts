
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { explainConcept as explainConceptFlow, type ExplainConceptInput, type ExplainConceptOutput } from '@/ai/flows/explain-concept-flow'; // Added import
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
      retrievedInformation: undefined, // Ensure all fields are present
    };
  }
}

export async function handleExplainQuestionConcept(
  questionText: string,
  level: EducationalLevel,
  subject: string
): Promise<ExplainConceptOutput> {
  try {
    const input: ExplainConceptInput = {
      concept: questionText, // Use the question text as the concept to explain
      level,
      subject,
    };
    const result = await explainConceptFlow(input);
    return result;
  } catch (error) {
    console.error("Error in handleExplainQuestionConcept:", error);
    // Return a default error explanation or rethrow, depending on desired error handling
    return {
      explanation: "Sorry, I couldn't generate an explanation at this time. Please try again.",
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

const paperUploadActionSchema = z.object({
  title: z.string({ required_error: "Title is required." }).min(1, "Title cannot be empty."),
  description: z.string().optional(),
  level: z.enum(educationalLevels, { required_error: "Level is required." }),
  subject: z.string({ required_error: "Subject is required." }).min(1, "Subject cannot be empty."),
  year: z.string({ required_error: "Year is required." })
           .regex(/^\d{4}$/, "Year must be a 4-digit number.")
           .transform(val => parseInt(val, 10))
           .pipe(z.number().min(2000, "Year must be 2000 or later.").max(new Date().getFullYear() + 5, `Year cannot be too far in the future.`)),
  file: z.instanceof(File, { message: "A PDF file is required." })
    .refine(file => file.name !== "" && file.size > 0, { message: "File cannot be empty." })
    .refine(file => file.size <= 5 * 1024 * 1024, { message: `File size should be less than 5MB.` })
    .refine(
      (file) => ["application/pdf"].includes(file.type),
      { message: "Only .pdf files are accepted." }
    ),
});


export async function handlePaperUpload(formData: FormData) {
  try {
    const validatedData = paperUploadActionSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined, // Ensure undefined if null or empty
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      file: formData.get('file'),
    });


    if (!validatedData.success) {
      console.error("Validation errors:", validatedData.error.flatten().fieldErrors);
      // You could construct a more specific message from validatedData.error.flatten().fieldErrors
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      let errorMessages = "Invalid form data. Please check the following: ";
      const messages = Object.entries(fieldErrors).map(([key, value]) => `${key}: ${value?.join(', ')}`);
      errorMessages += messages.join('; ');
      return { success: false, message: messages.length > 0 ? errorMessages : "Invalid form data.", errors: fieldErrors };
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
