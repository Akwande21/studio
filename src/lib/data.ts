
import type { Paper, Comment, User, EducationalLevel, UserRole, RatingLogEntry, Question, Suggestion } from './types';
import { db, storage } from './firebaseConfig';
import { 
  doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, deleteDoc, Timestamp, runTransaction, writeBatch, collectionGroup, documentId 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_EMAIL = "ndlovunkosy21@gmail.com"; // Used for initial role setup

// --- User Profile Management (Firestore) ---
export const addUserProfileToFirestore = async (userId: string, name: string, email: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      name,
      email,
      role,
      avatarUrl: `https://placehold.co/100x100/64B5F6/FFFFFF?text=${name.charAt(0)}`,
      bookmarkedPaperIds: [],
      createdAt: serverTimestamp()
    }, { merge: true }); // Merge true to avoid overwriting if doc somehow exists partially
  } catch (error) {
    console.error("Error adding user profile to Firestore: ", error);
    throw error;
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
        bookmarkedPaperIds: data.bookmarkedPaperIds || [],
        createdAt: data.createdAt,
        dataAiHint: 'user avatar'
      } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile from Firestore: ", error);
    return null;
  }
};

export const updateUserProfileInFirestore = async (userId: string, updates: Partial<Pick<User, 'name' | 'role'>>): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User profile not found in Firestore.");
    }
    const currentData = userSnap.data() as User;

    if (updates.role && updates.role === 'Admin' && currentData.role !== 'Admin') {
        console.warn("Attempt to promote user to Admin blocked.");
        delete updates.role;
    }
    if (updates.role && currentData.role === 'Admin' && updates.role !== 'Admin') {
        console.warn("Attempt to change Admin role blocked.");
        delete updates.role;
    }
    
    await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
    const updatedUser = await getUserProfileFromFirestore(userId); // Re-fetch to get complete data
    return updatedUser;
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
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        id: docSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatarUrl,
        bookmarkedPaperIds: data.bookmarkedPaperIds || [],
        createdAt: data.createdAt,
        dataAiHint: 'user avatar'
      } as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users from Firestore: ", error);
    return [];
  }
};

// --- Paper Management (Firestore & Storage) ---
export const addPaperToFirestoreAndStorage = async (
  paperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'downloadUrl' | 'createdAt' | 'updatedAt'>,
  file: File,
  uploaderId: string
): Promise<Paper> => {
  try {
    // 1. Upload file to Firebase Storage
    const filePath = `papers/${uploaderId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // 2. Add paper metadata to Firestore
    const papersCollectionRef = collection(db, "papers");
    const newPaperRef = doc(papersCollectionRef); // Auto-generate ID
    
    const newPaperData: Omit<Paper, 'id'> = {
      ...paperData,
      downloadUrl,
      uploaderId,
      questions: [], // Initialize with empty questions
      averageRating: 0,
      ratingsCount: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(newPaperRef, newPaperData);

    return { id: newPaperRef.id, ...newPaperData } as Paper;
  } catch (error) {
    console.error("Error adding paper to Firestore and Storage: ", error);
    throw error;
  }
};

export const getPapersFromFirestore = async (filters?: { level?: EducationalLevel, subject?: string, year?: number, query?: string }): Promise<Paper[]> => {
  const papersCollectionRef = collection(db, "papers");
  let q = query(papersCollectionRef, orderBy("createdAt", "desc"));

  if (filters) {
    if (filters.level) q = query(q, where("level", "==", filters.level));
    if (filters.subject) q = query(q, where("subject", "==", filters.subject)); // Exact match for subject for now
    if (filters.year) q = query(q, where("year", "==", filters.year));
    // Query text search is complex with Firestore, usually requires a third-party service like Algolia or basic includes.
    // For now, we'll fetch all and filter client-side if query is present, or use a startsWith for title.
  }

  try {
    const querySnapshot = await getDocs(q);
    let papers: Paper[] = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Paper));

    if (filters?.query) {
      const queryLower = filters.query.toLowerCase();
      papers = papers.filter(p => 
        p.title.toLowerCase().includes(queryLower) || 
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }
    return papers;
  } catch (error) {
    console.error("Error fetching papers from Firestore: ", error);
    return [];
  }
};

export const getPaperByIdFromFirestore = async (id: string): Promise<Paper | null> => {
  try {
    const paperRef = doc(db, "papers", id);
    const paperSnap = await getDoc(paperRef);
    if (paperSnap.exists()) {
      return { id: paperSnap.id, ...paperSnap.data() } as Paper;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching paper ${id} from Firestore: `, error);
    return null;
  }
};


// --- Comment Management (Firestore) ---
// Fetching comments is done via real-time listener in PaperDetailClient.tsx
export const addCommentToFirestore = async (paperId: string, userId: string, text: string): Promise<Comment> => {
  try {
    const user = await getUserProfileFromFirestore(userId);
    if (!user) throw new Error("User not found for adding comment");

    const commentsCollectionRef = collection(db, `papers/${paperId}/comments`);
    const newCommentRef = doc(commentsCollectionRef); // Auto-generate ID

    const newCommentData: Omit<Comment, 'id' | 'paperId'> = {
      userId,
      userName: user.name,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      text,
      timestamp: serverTimestamp() as Timestamp,
    };
    await setDoc(newCommentRef, newCommentData);
    
    // For immediate feedback, construct the comment with potentially client-side timestamp
    // The real-time listener will soon pick up the server-confirmed one.
    return { 
        id: newCommentRef.id, 
        paperId, // Include for optimistic updates or context
        ...newCommentData, 
        timestamp: Timestamp.now() // Use client-side now for optimistic update
    } as Comment;

  } catch (error) {
    console.error("Error adding comment to Firestore: ", error);
    throw error;
  }
};


// --- Bookmark Management (Firestore) ---
export const toggleBookmarkInFirestore = async (paperId: string, userId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found for bookmarking.");

    const userData = userSnap.data() as User;
    let bookmarkedPaperIds = userData.bookmarkedPaperIds || [];
    const isCurrentlyBookmarked = bookmarkedPaperIds.includes(paperId);

    if (isCurrentlyBookmarked) {
      bookmarkedPaperIds = bookmarkedPaperIds.filter(id => id !== paperId);
    } else {
      bookmarkedPaperIds.push(paperId);
    }
    await updateDoc(userRef, { bookmarkedPaperIds });
    return !isCurrentlyBookmarked;
  } catch (error) {
    console.error("Error toggling bookmark in Firestore: ", error);
    throw error;
  }
};

export const getBookmarkedPapersFromFirestore = async (userId: string): Promise<Paper[]> => {
  try {
    const user = await getUserProfileFromFirestore(userId);
    if (!user || !user.bookmarkedPaperIds || user.bookmarkedPaperIds.length === 0) {
      return [];
    }
    const bookmarkedIds = user.bookmarkedPaperIds;
    
    // Firestore 'in' query is limited to 30 items per query. If more, chunk it.
    const papers: Paper[] = [];
    const chunkSize = 30;
    for (let i = 0; i < bookmarkedIds.length; i += chunkSize) {
        const chunk = bookmarkedIds.slice(i, i + chunkSize);
        if (chunk.length > 0) {
            const papersQuery = query(collection(db, "papers"), where(documentId(), "in", chunk));
            const querySnapshot = await getDocs(papersQuery);
            querySnapshot.forEach((docSnap) => {
                papers.push({ id: docSnap.id, ...docSnap.data() } as Paper);
            });
        }
    }
    return papers;
  } catch (error) {
    console.error("Error fetching bookmarked papers from Firestore: ", error);
    return [];
  }
};

// --- Rating Management (Firestore) ---
export const submitRatingToFirestore = async (paperId: string, userId: string, value: number): Promise<{ averageRating: number, ratingsCount: number }> => {
  const paperRef = doc(db, "papers", paperId);
  const ratingLogRef = doc(db, `papers/${paperId}/ratingsLog`, userId);

  try {
    return await runTransaction(db, async (transaction) => {
      const paperSnap = await transaction.get(paperRef);
      if (!paperSnap.exists()) throw new Error("Paper not found for rating.");
      
      const paperData = paperSnap.data() as Paper;
      const ratingLogSnap = await transaction.get(ratingLogRef);

      let currentTotalRating = paperData.averageRating * paperData.ratingsCount;
      let currentRatingsCount = paperData.ratingsCount;
      let newAverageRating = paperData.averageRating;

      if (ratingLogSnap.exists()) {
        // User is updating their rating
        const previousRatingEntry = ratingLogSnap.data() as RatingLogEntry;
        currentTotalRating = currentTotalRating - previousRatingEntry.value + value;
        newAverageRating = currentRatingsCount > 0 ? currentTotalRating / currentRatingsCount : value;
      } else {
        // New rating
        currentTotalRating += value;
        currentRatingsCount += 1;
        newAverageRating = currentRatingsCount > 0 ? currentTotalRating / currentRatingsCount : value;
      }
      
      transaction.set(ratingLogRef, { userId, value, timestamp: serverTimestamp() });
      transaction.update(paperRef, { 
        averageRating: newAverageRating, 
        ratingsCount: currentRatingsCount,
        updatedAt: serverTimestamp()
      });
      
      return { averageRating: newAverageRating, ratingsCount: currentRatingsCount };
    });
  } catch (error) {
    console.error("Error submitting rating to Firestore: ", error);
    throw error;
  }
};


// --- Suggestion Management (Firestore) ---
// Fetching suggestions is done via real-time listener in AdminSuggestionsPage.tsx
export const addSuggestionToFirestore = async (
  suggestionData: Omit<Suggestion, 'id' | 'timestamp'> & { userId?: string }
): Promise<Suggestion> => {
  try {
    const suggestionsCollectionRef = collection(db, "suggestions");
    const newSuggestionRef = doc(suggestionsCollectionRef); // Auto-generate ID

    const dataToSave: Omit<Suggestion, 'id'> = {
        ...suggestionData,
        isRead: false,
        timestamp: serverTimestamp() as Timestamp,
    };

    await setDoc(newSuggestionRef, dataToSave);
    return { id: newSuggestionRef.id, ...dataToSave, timestamp: Timestamp.now() } as Suggestion; // Optimistic timestamp
  } catch (error) {
    console.error("Error adding suggestion to Firestore: ", error);
    throw error;
  }
};

// --- Utility to get current Admin (needed for ensuring Admin role in AuthContext for example) ---
export const getAdminUser = async (): Promise<User | null> => {
  // This function is a bit of a workaround. Ideally, admin status is purely role-based.
  // It finds a user whose email matches ADMIN_EMAIL.
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", ADMIN_EMAIL), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const adminDoc = snapshot.docs[0];
      return { id: adminDoc.id, ...adminDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching admin user by email:", error);
    return null;
  }
};
