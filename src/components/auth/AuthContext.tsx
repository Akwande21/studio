
"use client";
import type { User, UserRole, AuthContextType, Grade } from '@/lib/types'; // Added Grade
import { auth, db } from '@/lib/firebaseConfig'; // Import Firebase auth and db
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User as FirebaseUser 
} from 'firebase/auth';
import { addUserProfileToFirestore, getUserProfileFromFirestore } from '@/lib/data';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL_CONST = "ndlovunkosy21@gmail.com"; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userProfile = await getUserProfileFromFirestore(firebaseUser.uid);
      if (userProfile) {
        setUser(userProfile);
      } else {
        if (firebaseUser.email === ADMIN_EMAIL_CONST) {
          try {
            console.log("Admin user logged in, attempting to ensure Firestore profile exists.");
            await addUserProfileToFirestore(firebaseUser.uid, "Admin User", firebaseUser.email!, "Admin");
            const newProfile = await getUserProfileFromFirestore(firebaseUser.uid);
            setUser(newProfile); 
          } catch (e) {
            console.error("Failed to create or fetch Firestore profile for admin:", e);
            setUser(null); 
          }
        } else {
          console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no profile found in Firestore.`);
          setUser(null); 
        }
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        fetchAndSetUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchAndSetUser]);

  const signIn = useCallback(async (credentials: { email: string; password?: string }) => {
    let passwordToUse: string | undefined = credentials.password;

    if (credentials.email === ADMIN_EMAIL_CONST) {
      passwordToUse = "Nkosy@08";
      if (!credentials.password) { 
          console.log("Admin login attempt: using hardcoded password.");
      }
    }
    
    if (!passwordToUse) { 
        toast({ title: "Sign In Failed", description: "Password is required.", variant: "destructive" });
        return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, passwordToUse);
    } catch (error: any) {
      console.error("Firebase Sign In Error:", error.code, error.message);
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-email') { 
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Sign In Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); 
    } 
  }, [toast]);
  
  const signUp = useCallback(async (details: { name: string; email: string; password?: string; role: UserRole; grade?: Grade }) => {
    if (!details.password) {
        toast({ title: "Sign Up Failed", description: "Password is required.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password);
      const firebaseUser = userCredential.user;
      await addUserProfileToFirestore(firebaseUser.uid, details.name, details.email, details.role, details.grade); // Pass grade
    } catch (error: any) {
      console.error("Firebase Sign Up Error:", error);
      let errorMessage = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Sign Up Error", description: errorMessage, variant: "destructive" });
      setLoading(false); 
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    } 
  }, [toast]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setLoading(true);
    try {
        await firebaseSendPasswordResetEmail(auth, email);
        toast({ title: "Password Reset Email Sent", description: "Check your email for instructions to reset your password." });
    } catch (error: any) {
        let errorMessage = "Failed to send password reset email. Please try again.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No user found with this email address.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "The email address is not valid.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        toast({ title: "Password Reset Error", description: errorMessage, variant: "destructive"});
    } finally {
        setLoading(false);
    }
  }, [toast]);

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      setLoading(true);
      await fetchAndSetUser(auth.currentUser); 
    }
  }, [fetchAndSetUser]);


  return (
    <AuthContext.Provider value={{ 
        user, 
        signIn, 
        signUp, 
        signOut, 
        sendPasswordResetEmail, 
        loading, 
        isAuthenticated: !!user && !loading,
        refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
