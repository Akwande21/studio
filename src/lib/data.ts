
import type { Paper, Comment, User, EducationalLevel, UserRole, RatingLogEntry, Question, Suggestion, Grade } from './types'; 
import { db, storage } from './firebaseConfig';
import { 
  doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, deleteDoc, Timestamp, runTransaction, writeBatch, collectionGroup, documentId, FieldValue, deleteField 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_EMAIL = "ndlovunkosy21@gmail.com"; 

// --- User Profile Management (Firestore) ---
export const addUserProfileToFirestore = async (userId: string, name: string, email: string, role: UserRole, grade?: Grade): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const userData: Partial<User> = { 
      name,
      email,
      role,
      avatarUrl: `https://placehold.co/100x100/64B5F6/FFFFFF?text=${name.charAt(0)}`,
      bookmarkedPaperIds: [],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    if (role === "High School" && grade) {
      userData.grade = grade;
    }
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error adding user profile to Firestore: ", error);
    throw error;
  }
};

export const getUserProfileFromFirestore = async (userId: string): Promise<User | null> => {
  try {
    console.log(`[Data:getUserProfileFromFirestore] Attempting to fetch user with ID: '${userId}'`);
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn(`[Data:getUserProfileFromFirestore] Invalid or empty userId provided: '${userId}'`);
        return null;
    }
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        grade: data.grade, 
        avatarUrl: data.avatarUrl,
        bookmarkedPaperIds: data.bookmarkedPaperIds || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt, 
        dataAiHint: 'user avatar'
      } as User;
    }
    console.warn(`[Data:getUserProfileFromFirestore] No user document found for ID: '${userId}'`);
    return null;
  } catch (error) {
    console.error(`[Data:getUserProfileFromFirestore] Error fetching user profile for ID '${userId}': `, error);
    return null;
  }
};

export const updateUserProfileInFirestore = async (userId: string, updates: Partial<Pick<User, 'name' | 'role' | 'grade'>>): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error(`[Data:updateUserProfileInFirestore] User profile not found for userId: ${userId} during update attempt.`);
      throw new Error("User profile not found in Firestore for update.");
    }
    const currentData = userSnap.data() as User;

    const updatePayload: any = { updatedAt: serverTimestamp() };

    if (updates.name && updates.name !== currentData.name) {
      updatePayload.name = updates.name;
    }
    if (updates.role && updates.role !== currentData.role) {
      updatePayload.role = updates.role;
    }

    // Handle grade update or removal
    if (updates.hasOwnProperty('grade')) { // Check if 'grade' was explicitly part of the updates
        if (updates.grade === undefined || updates.grade === null) {
            // If grade is explicitly set to undefined or null, remove it
            if (currentData.grade) { // Only add deleteField if grade actually exists
                 updatePayload.grade = deleteField();
            }
        } else if (updates.grade !== currentData.grade) {
            updatePayload.grade = updates.grade; // Set new grade
        }
    } else if (updates.role && updates.role !== "High School" && currentData.grade) {
        // If role changed to non-HS, and grade wasn't explicitly in updates, remove grade
        updatePayload.grade = deleteField();
    }
    
    // Prevent changing Admin role or promoting to Admin through this function
    if (currentData.role === 'Admin' && updates.role && updates.role !== 'Admin') {
        console.warn("[Data:updateUserProfileInFirestore] Attempt to change Admin role blocked.");
        delete updatePayload.role; 
    }
    if (updates.role === 'Admin' && currentData.role !== 'Admin') {
        console.warn("[Data:updateUserProfileInFirestore] Attempt to promote user to Admin blocked.");
        delete updatePayload.role;
    }

    if (Object.keys(updatePayload).length > 1) { // more than just updatedAt
        await updateDoc(userRef, updatePayload);
    } else {
        console.log("[Data:updateUserProfileInFirestore] No actual changes to user profile data, skipping updateDoc.");
    }
    
    const updatedUser = await getUserProfileFromFirestore(userId);
    return updatedUser;
  } catch (error) {
    console.error(`[Data:updateUserProfileInFirestore] Error updating user profile for userId '${userId}': `, error);
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
        grade: data.grade, 
        avatarUrl: data.avatarUrl,
        bookmarkedPaperIds: data.bookmarkedPaperIds || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
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
  paperData: Omit<Paper, 'id' | 'averageRating' | 'ratingsCount' | 'questions' | 'downloadUrl' | 'createdAt' | 'updatedAt'> & { grade?: Grade },
  file: File,
  uploaderId: string
): Promise<Paper> => {
  try {
    const filePath = `papers/${uploaderId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    const papersCollectionRef = collection(db, "papers");
    const newPaperRef = doc(papersCollectionRef); 
    
    const newPaperData: Omit<Paper, 'id'> = {
      ...paperData,
      downloadUrl,
      uploaderId,
      questions: paperData.questions || [], 
      averageRating: 0,
      ratingsCount: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    if (paperData.level === "High School" && paperData.grade) {
      newPaperData.grade = paperData.grade;
    }


    await setDoc(newPaperRef, newPaperData);

    return { id: newPaperRef.id, ...newPaperData } as Paper;
  } catch (error) {
    console.error("Error adding paper to Firestore and Storage: ", error);
    throw error;
  }
};

export const getPapersFromFirestore = async (filters?: { level?: EducationalLevel, subject?: string, year?: number, grade?: Grade, query?: string }): Promise<Paper[]> => {
  const papersCollectionRef = collection(db, "papers");
  let q = query(papersCollectionRef, orderBy("createdAt", "desc"));


  if (filters) {
    if (filters.level) q = query(q, where("level", "==", filters.level));
    if (filters.subject) q = query(q, where("subject", "==", filters.subject));
    if (filters.year) q = query(q, where("year", "==", filters.year));
    if (filters.level === "High School" && filters.grade) {
      q = query(q, where("grade", "==", filters.grade));
    }
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
export const addCommentToFirestore = async (paperId: string, userId: string, text: string): Promise<Comment> => {
  try {
    const user = await getUserProfileFromFirestore(userId);
    if (!user) throw new Error("User not found for adding comment");

    const commentsCollectionRef = collection(db, `papers/${paperId}/comments`);
    const newCommentRef = doc(commentsCollectionRef); 

    const newCommentData: Omit<Comment, 'id' | 'paperId'> = {
      userId,
      userName: user.name,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      text,
      timestamp: serverTimestamp() as Timestamp,
    };
    await setDoc(newCommentRef, newCommentData);
    
    return { 
        id: newCommentRef.id, 
        paperId, 
        ...newCommentData, 
        timestamp: Timestamp.now() 
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
    await updateDoc(userRef, { bookmarkedPaperIds, updatedAt: serverTimestamp() });
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
    
    const papers: Paper[] = [];
    const chunkSize = 30; // Firestore 'in' query limit is 30
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
        const previousRatingEntry = ratingLogSnap.data() as RatingLogEntry;
        currentTotalRating = currentTotalRating - previousRatingEntry.value + value;
        newAverageRating = currentRatingsCount > 0 ? currentTotalRating / currentRatingsCount : value; // No change to count here
      } else {
        currentTotalRating += value;
        currentRatingsCount += 1; // Count increases only for new raters
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
export const addSuggestionToFirestore = async (
  suggestionData: Omit<Suggestion, 'id' | 'timestamp'> & { userId?: string }
): Promise<Suggestion> => {
  try {
    const suggestionsCollectionRef = collection(db, "suggestions");
    const newSuggestionRef = doc(suggestionsCollectionRef); 

    const dataToSave: Omit<Suggestion, 'id'> = {
        ...suggestionData,
        isRead: false,
        timestamp: serverTimestamp() as Timestamp,
    };

    await setDoc(newSuggestionRef, dataToSave);
    return { id: newSuggestionRef.id, ...dataToSave, timestamp: Timestamp.now() } as Suggestion;
  } catch (error) {
    console.error("Error adding suggestion to Firestore: ", error);
    throw error;
  }
};

// --- Utility to get current Admin (needed for ensuring Admin role in AuthContext for example) ---
export const getAdminUser = async (): Promise<User | null> => {
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
