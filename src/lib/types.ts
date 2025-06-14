
export interface Question {
  id: string;
  text: string;
  answer?: string; 
}

export type PaperLevel = "High School" | "College" | "University";
export const paperLevels: PaperLevel[] = ["High School", "College", "University"];

export interface Paper {
  id: string;
  title: string;
  level: PaperLevel;
  subject: string;
  year: number;
  questions: Question[];
  averageRating: number;
  ratingsCount: number;
  isBookmarked?: boolean; 
  downloadUrl?: string; // For PDF download or other formats
  description?: string; // Brief description of the paper
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
  userRole?: PaperLevel; // To show user's role with comment
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: PaperLevel;
  avatarUrl?: string;
}

export interface Rating {
  paperId: string;
  userId: string;
  value: number; // 1-5
  timestamp: string; // ISO string
}

export interface AuthContextType {
  user: User | null;
  signIn: (credentials: { email: string; name: string; role: PaperLevel }) => void; // Simplified signIn
  signUp: (details: { name: string; email: string; role: PaperLevel }) => void; // Simplified signUp
  signOut: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface StudySuggestion {
  topics: string[];
  searchQueries: string[];
}
