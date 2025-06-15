
import type { Paper, Comment, User, EducationalLevel, UserRole, Rating, Question } from './types'; // Updated imports

const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'Admin', avatarUrl: 'https://placehold.co/100x100?text=A' , dataAiHint: 'user avatar' },
  { id: 'user2', name: 'Bob The Builder', email: 'bob@example.com', role: 'College', avatarUrl: 'https://placehold.co/100x100?text=B', dataAiHint: 'user avatar' },
  { id: 'user3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'High School', avatarUrl: 'https://placehold.co/100x100?text=C', dataAiHint: 'user avatar' },
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


export let mockPapers: Paper[] = [ // Made mockPapers let so it can be modified
  { 
    id: '1', 
    title: 'Mathematics Grade 10 Final Exam', 
    level: 'High School', // EducationalLevel
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
    level: 'College', // EducationalLevel
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
    level: 'University', // EducationalLevel
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
    level: 'College', // EducationalLevel
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

export const mockComments: Comment[] = [
  { id: 'c1', paperId: '1', userId: 'user2', userName: 'Bob The Builder', userAvatar: mockUsers[1].avatarUrl, text: 'Great paper for revision!', timestamp: new Date(Date.now() - 86400000).toISOString(), userRole: 'College' },
  { id: 'c2', paperId: '1', userId: 'user3', userName: 'Charlie Brown', userAvatar: mockUsers[2].avatarUrl, text: 'Question 2 was tricky.', timestamp: new Date(Date.now() - 3600000).toISOString(), userRole: 'High School' },
  { id: 'c3', paperId: '2', userId: 'user1', userName: 'Alice Wonderland', userAvatar: mockUsers[0].avatarUrl, text: 'Helped me a lot for my physics exam.', timestamp: new Date(Date.now() - 172800000).toISOString(), userRole: 'Admin' },
];

export const mockRatings: Rating[] = [
    { paperId: '1', userId: 'user1', value: 5, timestamp: new Date().toISOString() },
    { paperId: '1', userId: 'user2', value: 4, timestamp: new Date().toISOString() },
    { paperId: '2', userId: 'user3', value: 4, timestamp: new Date().toISOString() },
];


// API-like functions
export const getPapers = async (filters?: { level?: EducationalLevel, subject?: string, year?: number, query?: string }): Promise<Paper[]> => { // Changed filter type
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
  if (!user) throw new Error("User not found");
  const newComment: Comment = {
    id: `c${mockComments.length + 1}`,
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
        paper.averageRating = paperRatings.reduce((sum, r) => sum + r.value, 0) / paperRatings.length;
        paper.ratingsCount = paperRatings.length;
    }
    return mockRatings.find(r => r.paperId === paperId && r.userId === userId)!;
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

export const createUser = async (name: string, email: string, role: UserRole): Promise<User> => { // Changed role type
  await new Promise(resolve => setTimeout(resolve, 500));
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }
  const newUser: User = {
    id: `user${mockUsers.length + 1}`,
    name,
    email,
    role,
    avatarUrl: 'https://placehold.co/100x100?text=U', dataAiHint: 'user avatar' 
  };
  mockUsers.push(newUser);
  return newUser;
}

export const loginUser = async (email: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers.find(u => u.email === email) || null;
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
