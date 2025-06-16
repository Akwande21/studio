
import type { Paper, Comment, User, EducationalLevel, UserRole, Rating, Question, Suggestion } from './types';
import { nonAdminRoles } from './types';

// Admin email constant
const ADMIN_EMAIL = "ndlovunkosy21@gmail.com";
const ADMIN_PASSWORD = "Nkosy@08";

export let mockUsers: User[] = [
  {
    id: 'admin001',
    name: 'Admin User',
    email: ADMIN_EMAIL,
    role: 'Admin',
    avatarUrl: `https://placehold.co/100x100/D32F2F/FFFFFF?text=A`,
    dataAiHint: 'admin avatar'
  }
];

const mockQuestions: Record<string, Question[]> = {
  math101: [
    { id: 'q1', text: 'What is 2 + 2?', answer: '4' },
    { id: 'q2', text: 'Solve for x: 2x + 5 = 15.', answer: 'x = 5' },
  ],
  physics202: [
    { id: 'q3', text: 'Explain Newton\'s First Law of Motion.', answer: 'An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.' },
    { id: 'q4', text: 'What is the formula for kinetic energy?', answer: 'KE = 1/2 mv^2' },
  ],
  history303: [
    { id: 'q5', text: 'When did World War II end?', answer: '1945' },
  ],
  cs101: [
    { id: 'q6', text: 'What is a variable in programming?', answer: 'A variable is a storage location identified by a memory address and an associated symbolic name, which contains some known or unknown quantity of information referred to as a value.'},
    { id: 'q7', text: 'Explain the concept of a loop.', answer: 'A loop is a sequence of instructions that is continually repeated until a certain condition is reached.'}
  ]
};


export let mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Mathematics Grade 10 Final Exam',
    level: 'High School',
    subject: 'Mathematics',
    year: 2023,
    questions: mockQuestions.math101,
    averageRating: 4.5,
    ratingsCount: 120,
    isBookmarked: false,
    downloadUrl: '/papers/math_grade10_2023.pdf',
    description: 'Comprehensive final exam for 10th grade mathematics covering algebra, geometry, and trigonometry.'
  },
  {
    id: '2',
    title: 'Introduction to Physics Midterm',
    level: 'College',
    subject: 'Physics',
    year: 2022,
    questions: mockQuestions.physics202,
    averageRating: 4.2,
    ratingsCount: 85,
    isBookmarked: true,
    downloadUrl: '/papers/physics_intro_midterm_2022.pdf',
    description: 'Midterm exam for introductory college physics, focusing on mechanics and thermodynamics.'
  },
  {
    id: '3',
    title: 'World History Advanced Placement Test',
    level: 'University',
    subject: 'History',
    year: 2023,
    questions: mockQuestions.history303,
    averageRating: 4.8,
    ratingsCount: 200,
    isBookmarked: false,
    downloadUrl: '/papers/history_ap_2023.pdf',
    description: 'Advanced placement test for university-level world history, covering major global events and civilizations.'
  },
  {
    id: '4',
    title: 'Computer Science 101 Final',
    level: 'College',
    subject: 'Computer Science',
    year: 2023,
    questions: mockQuestions.cs101,
    averageRating: 4.6,
    ratingsCount: 150,
    isBookmarked: false,
    downloadUrl: '/papers/cs101_final_2023.pdf',
    description: 'Final exam for an introductory computer science course, including programming fundamentals and data structures.'
  },
];

export let mockComments: Comment[] = [];

export let mockRatings: Rating[] = [];

export let mockSuggestions: Suggestion[] = [];


// API-like functions
export const getPapers = async (filters?: { level?: EducationalLevel, subject?: string, year?: number, query?: string }): Promise<Paper[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  let papers = [...mockPapers];
  if (filters) {
    if (filters.level) papers = papers.filter(p => p.level === filters.level);
    if (filters.subject) papers = papers.filter(p => p.subject.toLowerCase().includes(filters.subject!.toLowerCase()));
    if (filters.year) papers = papers.filter(p => p.year === filters.year);
    if (filters.query) papers = papers.filter(p => p.title.toLowerCase().includes(filters.query!.toLowerCase()) || p.description?.toLowerCase().includes(filters.query!.toLowerCase()));
  }
  return papers.map(p => ({...p, isBookmarked: p.isBookmarked === undefined ? Math.random() > 0.7 : p.isBookmarked}));
};

export const getPaperById = async (id: string): Promise<Paper | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const paper = mockPapers.find(p => p.id === id);
  if (paper) {
    return {...paper, isBookmarked: paper.isBookmarked === undefined ? Math.random() > 0.5 : paper.isBookmarked};
  }
  return undefined;
};

export const getCommentsByPaperId = async (paperId: string): Promise<Comment[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockComments.filter(c => c.paperId === paperId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addComment = async (paperId: string, userId: string, text: string): Promise<Comment> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error("User not found for adding comment");
  const newComment: Comment = {
    id: `c${mockComments.length + 1}${Date.now()}`,
    paperId,
    userId,
    userName: user.name,
    userAvatar: user.avatarUrl,
    text,
    timestamp: new Date().toISOString(),
    userRole: user.role,
  };
  mockComments.push(newComment);
  return newComment;
};

export const toggleBookmark = async (paperId: string, userId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const paperIndex = mockPapers.findIndex(p => p.id === paperId);
    if (paperIndex !== -1) {
        if (mockPapers[paperIndex].isBookmarked === undefined) {
            mockPapers[paperIndex].isBookmarked = false;
        }
        mockPapers[paperIndex].isBookmarked = !mockPapers[paperIndex].isBookmarked;
        return mockPapers[paperIndex].isBookmarked!;
    }
    throw new Error("Paper not found for bookmarking.");
}

export const submitRating = async (paperId: string, userId: string, value: number): Promise<Rating> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const existingRatingIndex = mockRatings.findIndex(r => r.paperId === paperId && r.userId === userId);
    if (existingRatingIndex !== -1) {
        mockRatings[existingRatingIndex].value = value;
        mockRatings[existingRatingIndex].timestamp = new Date().toISOString();
    } else {
      const newRating: Rating = {
          paperId,
          userId,
          value,
          timestamp: new Date().toISOString(),
      };
      mockRatings.push(newRating);
    }

    const paper = mockPapers.find(p => p.id === paperId);
    if (paper) {
        const paperRatings = mockRatings.filter(r => r.paperId === paperId);
        if (paperRatings.length > 0) {
          paper.averageRating = paperRatings.reduce((sum, r) => sum + r.value, 0) / paperRatings.length;
        } else {
          paper.averageRating = 0;
        }
        paper.ratingsCount = paperRatings.length;
    }
    const currentRating = mockRatings.find(r => r.paperId === paperId && r.userId === userId);
    if (!currentRating) throw new Error("Rating could not be processed or found after submission.");
    return currentRating;
}

export const getBookmarkedPapers = async (userId: string): Promise<Paper[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPapers.filter(p => p.isBookmarked);
}

export const getUserById = async (userId: string): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUsers.find(u => u.id === userId);
}

export const getUniqueSubjects = async (): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const subjects = new Set(mockPapers.map(p => p.subject));
  return Array.from(subjects);
}

export const getUniqueYears = async (): Promise<number[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const years = new Set(mockPapers.map(p => p.year));
  return Array.from(years).sort((a,b) => b - a);
}

export const createUser = async (name: string, email: string, role: UserRole): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const existingUserByEmail = mockUsers.find(u => u.email === email);
  if (existingUserByEmail) {
    throw new Error("User with this email already exists.");
  }
  const newUserId = `user${mockUsers.length + 1}${Date.now()}`;
  const newUser: User = {
    id: newUserId,
    name,
    email,
    role,
    avatarUrl: `https://placehold.co/100x100/64B5F6/FFFFFF?text=${name.charAt(0)}`, dataAiHint: 'user avatar'
  };
  mockUsers.push(newUser);
  return newUser;
}

export const loginUser = async (email: string, password?: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const user = mockUsers.find(u => u.email === email);

  if (user) {
    if (user.email === ADMIN_EMAIL) {
      // Specific password check for admin
      if (password === ADMIN_PASSWORD) {
        return user;
      }
      return null; // Admin password incorrect
    }
    // For other users, password check is skipped in this mock
    return user;
  }
  return null; // User not found
}

export const addUploadedPaper = async (
  paperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'isBookmarked'> & { downloadUrl: string }
): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const newPaper: Paper = {
    id: `paper${Date.now()}${Math.floor(Math.random() * 1000)}`,
    ...paperData,
    questions: [],
    averageRating: 0,
    ratingsCount: 0,
    isBookmarked: false,
  };
  mockPapers.unshift(newPaper);
  return newPaper;
};

export const updateUserDetails = async (
  userId: string, 
  updates: { name?: string; role?: UserRole }
): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return null; // User not found
  }

  const userToUpdate = { ...mockUsers[userIndex] };

  if (updates.name) {
    userToUpdate.name = updates.name;
  }

  if (updates.role) {
    // Prevent changing an Admin's role
    // Prevent promoting a non-Admin to Admin
    if (mockUsers[userIndex].role === 'Admin' && updates.role !== 'Admin') {
      // Trying to demote an admin - disallow for this simple form
      console.warn(`Attempt to change role of Admin user ${userId} was blocked.`);
    } else if (mockUsers[userIndex].role !== 'Admin' && updates.role === 'Admin') {
      // Trying to promote a user to Admin - disallow for this simple form
      console.warn(`Attempt to promote user ${userId} to Admin was blocked.`);
    } else if (mockUsers[userIndex].role !== 'Admin' && nonAdminRoles.includes(updates.role as Exclude<UserRole, "Admin">)) {
      userToUpdate.role = updates.role;
    }
  }
  
  mockUsers[userIndex] = userToUpdate;
  return userToUpdate;
};

export const getMockSuggestions = async (): Promise<Suggestion[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async fetch
  return [...mockSuggestions].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
