
import type { Paper, Comment, User, EducationalLevel, UserRole, Rating, Question, Suggestion } from './types';
import { nonAdminRoles } from './types';
import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

// Admin email constant - used for initial role setup if needed, but auth is Firebase.
const ADMIN_EMAIL = "ndlovunkosy21@gmail.com";

// mockUsers is now primarily for bootstrapping the admin user's role in Firestore if not present,
// or for UI elements that might temporarily need it before Firestore sync.
// Actual user data and authentication are handled by Firebase Auth and Firestore.
export let mockUsers: User[] = [
  {
    id: 'admin_placeholder_uid', // This ID will be replaced by actual Firebase UID
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

// Mock data for papers, comments, ratings will be replaced by Firestore interactions.
// For now, keeping them for other parts of the app that haven't been migrated.
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


// Firestore User Profile Management
export const addUserProfileToFirestore = async (userId: string, name: string, email: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      name,
      email,
      role,
      avatarUrl: `https://placehold.co/100x100/64B5F6/FFFFFF?text=${name.charAt(0)}`, // Default avatar
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding user profile to Firestore: ", error);
    throw error; // Re-throw to be handled by caller
  }
};

export const getUserProfileFromFirestore = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatarUrl,
        dataAiHint: 'user avatar'
      } as User;
    } else {
      // Special handling for pre-defined admin if their Firestore doc doesn't exist yet
      const predefinedAdmin = mockUsers.find(u => u.email === ADMIN_EMAIL);
      if (predefinedAdmin && predefinedAdmin.email === (await getDoc(userRef).then(snap => snap.data()?.email))) { // Check if this UID corresponds to admin
         // This is problematic as we don't have firebase user's email here directly.
         // This logic should be simplified or handled by admin creating their own account.
         // For now, if an admin UID matches nothing, we assume it might be the bootstrapped admin.
         console.warn(`Firestore document for user ${userId} not found. If this is the admin, their profile might need to be created.`);
      }
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore: ", error);
    return null;
  }
};

export const updateUserProfileInFirestore = async (userId: string, updates: { name?: string; role?: UserRole }): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User profile not found in Firestore.");
    }
    const currentData = userSnap.data() as User;

    // Prevent non-Admin from being changed to Admin, and Admin role from being changed by this form.
    if (updates.role && updates.role === 'Admin' && currentData.role !== 'Admin') {
        console.warn("Attempt to promote user to Admin blocked via general update.");
        delete updates.role; // Or return error
    }
    if (updates.role && currentData.role === 'Admin' && updates.role !== 'Admin') {
        console.warn("Attempt to change Admin role blocked via general update.");
        delete updates.role;
    }
    
    await updateDoc(userRef, updates);
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();
    return {
        id: updatedSnap.id,
        name: updatedData?.name,
        email: updatedData?.email,
        role: updatedData?.role,
        avatarUrl: updatedData?.avatarUrl,
    } as User;
  } catch (error) {
    console.error("Error updating user profile in Firestore: ", error);
    throw error;
  }
};

export const getAllUsersFromFirestore = async (): Promise<User[]> => {
  try {
    const usersCollectionRef = collection(db, "users");
    const q = query(usersCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatarUrl,
        dataAiHint: 'user avatar'
      } as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users from Firestore: ", error);
    return []; // Return empty array on error
  }
};


// Mock data functions (to be phased out or adapted for Firestore)
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
  const user = await getUserProfileFromFirestore(userId); // Fetch from Firestore
  if (!user) throw new Error("User not found for adding comment");
  const newComment: Comment = {
    id: `c${mockComments.length + 1}${Date.now()}`, // This ID generation needs to be Firestore compatible
    paperId,
    userId,
    userName: user.name,
    userAvatar: user.avatarUrl,
    text,
    timestamp: new Date().toISOString(),
    userRole: user.role,
  };
  // This should save to Firestore instead
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
    // This should interact with user-specific bookmark data in Firestore
    throw new Error("Paper not found for bookmarking.");
}

export const submitRating = async (paperId: string, userId: string, value: number): Promise<Rating> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    // This entire rating logic needs to be Firestore-based.
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
    // Fetch from user's bookmarks in Firestore
    return mockPapers.filter(p => p.isBookmarked);
}

// Keep for non-Firebase user lookup if needed by other mock data parts
export const getUserById = async (userId: string): Promise<User | undefined> => {
    // Prioritize Firestore
    const firestoreUser = await getUserProfileFromFirestore(userId);
    if (firestoreUser) return firestoreUser;
    
    // Fallback to mockUsers (e.g., for admin that hasn't been fully synced)
    return mockUsers.find(u => u.id === userId || u.email === userId); // Looser match for admin
};


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

export const addUploadedPaper = async (
  paperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'isBookmarked'> & { downloadUrl: string }
): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  // This should save to Firestore 'papers' collection
  const newPaper: Paper = {
    id: `paper${Date.now()}${Math.floor(Math.random() * 1000)}`, // Firestore auto-ID
    ...paperData,
    questions: [],
    averageRating: 0,
    ratingsCount: 0,
    isBookmarked: false,
  };
  mockPapers.unshift(newPaper);
  return newPaper;
};


export const getMockSuggestions = async (): Promise<Suggestion[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); 
  // This should fetch from Firestore 'suggestions' collection
  return [...mockSuggestions].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
