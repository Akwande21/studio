
import type { Timestamp } from "firebase/firestore";

export interface Question {
  id: string;
  text: string;
  answer?: string;
}

// For user roles
export type UserRole = "High School" | "College" | "NCV" | "NATED" | "University" | "Admin";
export const userRoles: UserRole[] = ["High School", "College", "NCV", "NATED", "University", "Admin"];
export const nonAdminRoles: Exclude<UserRole, "Admin">[] = ["High School", "College", "NCV", "NATED", "University"];


// For paper educational levels
export type EducationalLevel = "High School" | "College" | "NCV" | "NATED" | "University";
export const educationalLevels: EducationalLevel[] = ["High School", "College", "NCV", "NATED", "University"];

// For High School Grades
export type Grade = "Grade 10" | "Grade 11" | "Grade 12";
export const grades: Grade[] = ["Grade 10", "Grade 11", "Grade 12"];

// For University Year Levels
export type UniversityYear = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export const universityYears: UniversityYear[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

// For University Study Types
export type UniversityType = "Degree" | "Diploma";
export const universityTypes: UniversityType[] = ["Degree", "Diploma"];


export interface Paper {
  id: string; // Firestore document ID
  title: string;
  level: EducationalLevel;
  subject: string;
  year: number;
  grade?: Grade; // Added for High School papers
  universityYear?: UniversityYear; // Added for University papers
  universityType?: UniversityType; // Added for University papers (Degree/Diploma)
  questions: Question[]; // Stored as an array of objects in Firestore
  averageRating: number;
  ratingsCount: number;
  isBookmarked?: boolean; // This will be a client-side derived field based on user's bookmarks
  downloadUrl?: string;
  description?: string;
  uploaderId: string; // UID of the user who uploaded it
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string; // Firestore document ID
  paperId: string; // For denormalization or client-side checks if needed, but primarily fetched via subcollection
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Timestamp; // Firestore Timestamp
  userRole?: UserRole;
}

export interface User {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  grade?: Grade; // Added for High School students
  universityYear?: UniversityYear; // Added for University students
  universityType?: UniversityType; // Added for University students (Degree/Diploma)
  avatarUrl?: string;
  dataAiHint?: string; 
  bookmarkedPaperIds?: string[]; // Array of paper IDs
  createdAt?: Timestamp; // Firestore Timestamp for user creation
  updatedAt?: Timestamp; // Firestore Timestamp for last profile update
}

export interface RatingLogEntry {
  // Stored in papers/{paperId}/ratingsLog/{userId}
  userId: string; // Document ID in this subcollection is userId
  value: number; // 1-5
  timestamp: Timestamp;
}


export interface AuthContextType {
  user: User | null;
  signIn: (credentials: { email: string; password?: string }) => Promise<void>; 
  signUp: (details: { name: string; email: string; password?: string; role: UserRole; grade?: Grade; universityYear?: UniversityYear; universityType?: UniversityType }) => Promise<void>; // Added grade and university fields
  signOut: () => void;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
}

export interface StudySuggestion {
  topics: string[];
  searchQueries: string[];
}

export interface Suggestion {
  id: string; // Firestore document ID
  name?: string;
  email?: string;
  subject: string;
  message: string;
  timestamp: Timestamp; // Firestore Timestamp
  isRead?: boolean;
  userId?: string; // UID of user who submitted if logged in
}
