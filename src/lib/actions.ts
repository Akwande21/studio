
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { explainConcept as explainConceptFlow, type ExplainConceptInput, type ExplainConceptOutput } from '@/ai/flows/explain-concept-flow'; 
import { 
  addComment as addMockComment, 
  toggleBookmark as toggleMockBookmark, 
  submitRating as submitMockRating, 
  getPaperById, 
  addUploadedPaper as addMockUploadedPaper,
  updateUserProfileInFirestore, // Changed from updateMockUserDetails
  getUserProfileFromFirestore, // Changed from getMockUserById
  mockSuggestions, // For admin suggestions, will be replaced by Firestore
  getAllUsersFromFirestore // For admin users page
} from './data';
import type { Paper, EducationalLevel, UserRole, Suggestion, User } from './types';
import { educationalLevels, nonAdminRoles } from './types';
import { z } from 'zod';
import { auth } from '@/lib/firebaseConfig'; // For password reset
import { sendPasswordResetEmail } from 'firebase/auth';


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
      retrievedInformation: undefined, 
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
      concept: questionText, 
      level,
      subject,
    };
    const result = await explainConceptFlow(input);
    return result;
  } catch (error) {
    console.error("Error in handleExplainQuestionConcept:", error);
    
    return {
      explanation: "Sorry, I couldn't generate an explanation at this time. Please try again.",
    };
  }
}


export async function handleAddComment(paperId: string, userId: string, text: string) {
  // This should be refactored to use Firestore for comments
  try {
    const comment = await addMockComment(paperId, userId, text);
    return { success: true, comment };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function handleToggleBookmark(paperId: string, userId: string) {
  // This should be refactored to use Firestore for bookmarks
  try {
    const isBookmarked = await toggleMockBookmark(paperId, userId);
    return { success: true, isBookmarked };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function handleSubmitRating(paperId: string, userId: string, value: number) {
  // This should be refactored to use Firestore for ratings
  try {
    const rating = await submitMockRating(paperId, userId, value);
    const updatedPaper = await getPaperById(paperId); // This also needs Firestore
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
  // This should save paper metadata to Firestore and file to Firebase Storage
  try {
    const validatedData = paperUploadActionSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined, 
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      file: formData.get('file'),
    });

    if (!validatedData.success) {
      console.error("Validation errors:", validatedData.error.flatten().fieldErrors);
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      let errorMessages = "Invalid form data. Please check the following: ";
      const messages = Object.entries(fieldErrors).map(([key, value]) => `${key}: ${value?.join(', ')}`);
      errorMessages += messages.join('; ');
      return { success: false, message: messages.length > 0 ? errorMessages : "Invalid form data.", errors: fieldErrors };
    }

    const { title, description, level, subject, year, file } = validatedData.data;

    const fileName = file.name.replace(/\s+/g, '_');
    const mockDownloadUrl = `/papers/uploads/mock_${Date.now()}_${fileName}`; // Placeholder

    const newPaperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'isBookmarked'> & { downloadUrl: string } = {
      title,
      description,
      level,
      subject,
      year,
      downloadUrl: mockDownloadUrl, // This would be a Firebase Storage URL
    };

    const newPaper = await addMockUploadedPaper(newPaperData); // Replace with Firestore save
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
    // This action is now handled directly by AuthContext calling Firebase SDK
    // Keeping this structure if direct server action call is preferred for some reason, but AuthContext is better.
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "If an account with that email exists, instructions to reset your password have been sent. Please check your inbox (and spam folder)."
    };
  } catch (error: any) {
    console.error("Error in handleForgotPasswordRequest (action):", error);
    return {
      success: false, 
      message: error.message || "Failed to send password reset email."
    };
  }
}

// handleResetPassword is removed as Firebase handles this flow via email link.

const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  name: z.string().min(2, "Full name must be at least 2 characters.").max(50, "Full name must be 50 characters or less."),
  role: z.enum(nonAdminRoles).optional(), 
});

export async function handleUpdateUserDetails(formData: FormData) {
  try {
    const rawData = {
      userId: formData.get('userId'),
      name: formData.get('name'),
      role: formData.get('role') || undefined, 
    };

    const validationResult = updateUserSchema.safeParse(rawData);

    if (!validationResult.success) {
      return { success: false, message: "Invalid data provided.", errors: validationResult.error.flatten().fieldErrors };
    }

    const { userId, name, role } = validationResult.data;

    const userToEdit = await getUserProfileFromFirestore(userId);
    if (!userToEdit) {
      return { success: false, message: "User not found." };
    }

    const updates: { name?: string; role?: UserRole } = { name };
    if (userToEdit.role !== 'Admin' && role && userToEdit.role !== role) {
      updates.role = role;
    } else if (userToEdit.role === 'Admin' && role && role !== 'Admin') {
      return { success: false, message: "Admin role cannot be changed through this form." };
    } else if (role && role === 'Admin' && userToEdit.role !== 'Admin') {
      return { success: false, message: "Cannot promote user to Admin through this form." };
    }

    const updatedUser = await updateUserProfileInFirestore(userId, updates);

    if (updatedUser) {
      return { success: true, user: updatedUser, message: "User details updated successfully." };
    } else {
      return { success: false, message: "Failed to update user details." };
    }
  } catch (error) {
    console.error("Error in handleUpdateUserDetails:", error);
    if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
    }
    return { success: false, message: (error as Error).message || "An unexpected error occurred while updating user details." };
  }
}

const sendSuggestionSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  subject: z.string().min(5, "Subject must be at least 5 characters long.").max(100, "Subject must be 100 characters or less."),
  message: z.string().min(10, "Message must be at least 10 characters long.").max(1000, "Message must be 1000 characters or less."),
});

export async function handleSendSuggestionToAdmin(formData: FormData) {
  // This should save suggestions to Firestore
  try {
    const rawData = {
      name: formData.get('name') || undefined,
      email: formData.get('email') || undefined,
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    const validationResult = sendSuggestionSchema.safeParse(rawData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => `${key}: ${value?.join(', ')}`)
        .join('; ');
      return { success: false, message: `Invalid data: ${errorMessages}`, errors: fieldErrors };
    }

    const { name, email, subject, message } = validationResult.data;

    const newSuggestion: Omit<Suggestion, 'id' | 'timestamp'> & {timestamp?: any} = { // Prepare for Firestore
      name: name || undefined,
      email: email || undefined,
      subject,
      message,
      timestamp: serverTimestamp(), // Use Firestore server timestamp
      isRead: false, 
    };
    
    // Save to Firestore 'suggestions' collection
    // Example: await addDoc(collection(db, "suggestions"), newSuggestion);
    // For now, adding to mockSuggestions
    const tempId = `sug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    mockSuggestions.unshift({id: tempId, ...newSuggestion, timestamp: new Date().toISOString()} as Suggestion);


    return { success: true, message: "Thank you for your suggestion! It has been received." };

  } catch (error) {
    console.error("Error in handleSendSuggestionToAdmin:", error);
    return { success: false, message: "An unexpected error occurred while sending your suggestion." };
  }
}
