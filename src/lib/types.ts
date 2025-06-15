
export interface Question {
  id: string;
  text: string;
  answer?: string;
}

// For user roles
export type UserRole = "High School" | "College" | "University" | "Admin";
export const userRoles: UserRole[] = ["High School", "College", "University", "Admin"];

// For paper educational levels
export type EducationalLevel = "High School" | "College" | "University";
export const educationalLevels: EducationalLevel[] = ["High School", "College", "University"];


export interface Paper {
  id: string;
  title: string;
  level: EducationalLevel;
  subject: string;
  year: number;
  questions: Question[];
  averageRating: number;
  ratingsCount: number;
  isBookmarked?: boolean;
  downloadUrl?: string;
  description?: string;
}

export interface Comment {
  id: string;
  paperId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string; // ISO string
  parentId?: string;
  userRole?: UserRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  dataAiHint?: string; // Added for placeholder consistency
}

export interface Rating {
  paperId: string;
  userId: string;
  value: number; // 1-5
  timestamp: string; // ISO string
}

export interface AuthContextType {
  user: User | null;
  signIn: (credentials: { email: string }) => Promise<void>;
  signUp: (details: { name: string; email: string; role: UserRole }) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface StudySuggestion {
  topics: string[];
  searchQueries: string[];
}
