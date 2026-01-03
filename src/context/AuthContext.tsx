'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
    getUser, createUser
} from '@/lib/firebase/collections';
import { User } from '@/types';

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch or create Firestore user when Firebase user changes
    const syncFirestoreUser = useCallback(async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
            setUser(null);
            return;
        }

        try {
            // Use email as the user identifier (or uid)
            const userId = fbUser.uid;
            let firestoreUser = await getUser(userId);

            if (!firestoreUser) {
                // Create new user in Firestore
                firestoreUser = await createUser(userId);
            }

            setUser(firestoreUser);
        } catch (err) {
            console.error('Error syncing Firestore user:', err);
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            await syncFirestoreUser(fbUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [syncFirestoreUser]);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(getErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, displayName?: string) => {
        try {
            setError(null);
            setLoading(true);
            const result = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(result.user, { displayName });
            }
        } catch (err: any) {
            setError(getErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(getErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
        } catch (err: any) {
            console.error('Sign out error:', err);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                user,
                loading,
                error,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to get user-friendly error messages
function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed.';
        default:
            return 'An error occurred. Please try again.';
    }
}
