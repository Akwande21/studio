
"use server";
import { suggestRelatedTopics as suggestRelatedTopicsFlow, type SuggestRelatedTopicsInput, type SuggestRelatedTopicsOutput } from '@/ai/flows/suggest-related-topics';
import { explainConcept as explainConceptFlow, type ExplainConceptInput, type ExplainConceptOutput } from '@/ai/flows/explain-concept-flow';
import {
  addCommentToFirestore,
  toggleBookmarkInFirestore,
  submitRatingToFirestore,
  addPaperToFirestoreAndStorage,
  updateUserProfileInFirestore, 
  getUserProfileFromFirestore,
  addSuggestionToFirestore,
} from './data'; 
import type { Paper, EducationalLevel, UserRole, Suggestion, User, Comment, Grade } from './types'; // Added Grade
import { educationalLevels, nonAdminRoles, grades } from './types'; // Added grades
import { z } from 'zod';
import { auth } from '@/lib/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Timestamp, deleteField } from 'firebase/firestore';


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
  try {
    const comment = await addCommentToFirestore(paperId, userId, text);
    const serializableComment = {
        ...comment,
        timestamp: comment.timestamp.toDate().toISOString(),
      };
    return { success: true, comment: serializableComment };
  } catch (error) {
    console.error("Error in handleAddComment action:", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function handleToggleBookmark(paperId: string, userId: string) {
  try {
    const isBookmarked = await toggleBookmarkInFirestore(paperId, userId);
    return { success: true, isBookmarked };
  } catch (error) {
    console.error("Error in handleToggleBookmark action:", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function handleSubmitRating(paperId: string, userId: string, value: number) {
  try {
    const { averageRating, ratingsCount } = await submitRatingToFirestore(paperId, userId, value);
    return { success: true, averageRating, ratingsCount };
  } catch (error) {
    console.error("Error in handleSubmitRating action:", error);
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
           .pipe(z.number().min(2000, "Year must be 2000 or later.").max(new Date().getFullYear() + 1, `Year cannot be too far in the future.`)),
  grade: z.enum(grades).optional(), // Added grade
  file: z.instanceof(File, { message: "A PDF file is required." })
    .refine(file => file.name !== "" && file.size > 0, { message: "File cannot be empty." })
    .refine(file => file.size <= 5 * 1024 * 1024, { message: `File size should be less than 5MB.` }) 
    .refine(
      (file) => ["application/pdf"].includes(file.type),
      { message: "Only .pdf files are accepted." }
    ),
  uploaderId: z.string().min(1, "Uploader ID is required."),
}).superRefine((data, ctx) => {
  if (data.level === "High School" && !data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grade is required for High School level papers.",
      path: ["grade"],
    });
  }
});


export async function handlePaperUpload(formData: FormData) {
  try {
    const uploaderId = formData.get('uploaderId') as string;
    if (!uploaderId) {
        return { success: false, message: "Uploader ID is missing. User must be authenticated." };
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      level: formData.get('level'),
      subject: formData.get('subject'),
      year: formData.get('year'),
      grade: formData.get('grade') || undefined, // Get grade
      file: formData.get('file'),
      uploaderId: uploaderId,
    };
    const validatedData = paperUploadActionSchema.safeParse(rawData);

    if (!validatedData.success) {
      console.error("Server validation errors (handlePaperUpload):", validatedData.error.flatten().fieldErrors);
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      let errorMessages = "Invalid form data. Please check the following: ";
      const messages = Object.entries(fieldErrors).map(([key, value]) => `${key}: ${value?.join(', ')}`);
      errorMessages += messages.join('; ');
      return { success: false, message: messages.length > 0 ? errorMessages : "Invalid form data.", errors: fieldErrors };
    }

    const { title, description, level, subject, year, grade, file } = validatedData.data;

    const paperMetadataToSave: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'downloadUrl' | 'createdAt' | 'updatedAt' | 'uploaderId'> & { uploaderId: string, grade?: Grade } = { 
        title, description, level, subject, year, uploaderId 
    };
    if (level === "High School" && grade) {
        paperMetadataToSave.grade = grade;
    }


    const newPaper = await addPaperToFirestoreAndStorage(paperMetadataToSave, file, uploaderId);

    const serializablePaper = {
      ...newPaper,
      createdAt: newPaper.createdAt.toDate().toISOString(),
      updatedAt: newPaper.updatedAt.toDate().toISOString(),
    };
    return { success: true, paper: serializablePaper };

  } catch (error: any) {
    console.error("Error in handlePaperUpload:", error);
    if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
    }
    if (error.code && typeof error.code === 'string') {
        if (error.code.startsWith('storage/')) {
            if (error.code === 'storage/unauthorized') {
                return { success: false, message: `Storage error: You do not have permission to upload this file. Check storage rules.` };
            }
            return { success: false, message: `Storage error: ${error.message}` };
        }
        if (error.code.startsWith('firestore/')) {
             if (error.code === 'firestore/permission-denied') {
                return { success: false, message: `Database error: You do not have permission to save paper data. Check Firestore rules.` };
            }
             return { success: false, message: `Database error: ${error.message}` };
        }
    }
    return { success: false, message: "An unexpected error occurred during paper upload." };
  }
}


const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  name: z.string().min(2, "Full name must be at least 2 characters.").max(50, "Full name must be 50 characters or less."),
  role: z.enum(nonAdminRoles).optional(), 
  grade: z.enum(grades).optional(),
}).superRefine((data, ctx) => {
    if (data.role === "High School" && !data.grade) {
        ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Grade is required if role is High School.",
        path: ["grade"],
        });
    }
});

export async function handleUpdateUserDetails(formData: FormData) {
  try {
    const rawData = {
      userId: formData.get('userId'),
      name: formData.get('name'),
      role: formData.get('role') || undefined, 
      grade: formData.get('grade') || undefined,
    };

    const validationResult = updateUserSchema.safeParse(rawData);

    if (!validationResult.success) {
      return { success: false, message: "Invalid data provided.", errors: validationResult.error.flatten().fieldErrors };
    }

    const { userId, name, role, grade } = validationResult.data;

    const userBeingEdited = await getUserProfileFromFirestore(userId);
    if (!userBeingEdited) {
      return { success: false, message: "User not found." };
    }

    const updates: Partial<Pick<User, 'name' | 'role' | 'grade'>> = { name };

    if (userBeingEdited.role === 'Admin') {
      // Admins cannot change their own role or grade via this form.
      console.log("Admin user editing profile. Role/grade change is disallowed for Admin via this form.");
    } else if (role) {
      updates.role = role;
      if (role === "High School" && grade) {
        updates.grade = grade;
      } else if (role !== "High School") {
        // If role is changed to something other than High School, clear the grade.
        // Firestore specific: use deleteField() to remove field, or set to null.
        // For simplicity in actions, we can pass null and data.ts can handle it.
        (updates as any).grade = null; // Or use deleteField() in data.ts
      }
    }
    
    const updatedUser = await updateUserProfileInFirestore(userId, updates);

    if (updatedUser) {
      const serializableUser = {
        ...updatedUser,
        createdAt: updatedUser.createdAt ? updatedUser.createdAt.toDate().toISOString() : undefined,
        updatedAt: updatedUser.updatedAt ? updatedUser.updatedAt.toDate().toISOString() : undefined,
      };
      return { success: true, user: serializableUser, message: "User details updated successfully." };
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
  userId: z.string().optional(), 
});

export async function handleSendSuggestionToAdmin(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') || undefined,
      email: formData.get('email') || undefined,
      subject: formData.get('subject'),
      message: formData.get('message'),
      userId: formData.get('userId') || undefined,
    };

    const validationResult = sendSuggestionSchema.safeParse(rawData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => `${key}: ${value?.join(', ')}`)
        .join('; ');
      return { success: false, message: `Invalid data: ${errorMessages}`, errors: fieldErrors };
    }

    const { name, email, subject, message, userId } = validationResult.data;

    const suggestionData: Omit<Suggestion, 'id' | 'timestamp' | 'isRead'> & {userId?: string} = {
      name: name || undefined,
      email: email || undefined,
      subject,
      message,
      userId: userId || undefined,
    };

    await addSuggestionToFirestore(suggestionData);

    return { success: true, message: "Thank you for your suggestion! It has been received." };

  } catch (error) {
    console.error("Error in handleSendSuggestionToAdmin:", error);
    return { success: false, message: "An unexpected error occurred while sending your suggestion." };
  }
}

export async function handleForgotPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
  if (!email || !z.string().email().safeParse(email).success) {
    return { success: false, message: "Please enter a valid email address." };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "If an account with that email exists, instructions to reset your password have been sent. Please check your inbox (and spam folder)."
    };
  } catch (error: any) {
    console.error("Error in handleForgotPasswordRequest (action):", error);
    if (error.code === 'auth/user-not-found') {
        return { success: false, message: "No user found with this email address."};
    }
    return {
      success: false,
      message: "Failed to send password reset email. Please try again later." 
    };
  }
}

export async function handleResetPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  if (newPassword.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." };
  }
  console.log("Simulating password reset with new password:", newPassword);
  return { success: true, message: "Password has been hypothetically reset successfully." };
}
