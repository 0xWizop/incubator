'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
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
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const userUnsubscribeRef = useRef<(() => void) | null>(null);

    // Refresh user data from Firestore
    const refreshUser = useCallback(async () => {
        if (!firebaseUser) return;
        const userData = await getUser(firebaseUser.uid);
        if (userData) setUser(userData);
    }, [firebaseUser]);

    // Setup real-time listener for user document
    const setupUserListener = useCallback(async (fbUser: FirebaseUser) => {
        // Clean up previous listener
        if (userUnsubscribeRef.current) {
            userUnsubscribeRef.current();
        }

        const userId = fbUser.uid;

        // First check if user exists, create if not
        let firestoreUser = await getUser(userId);
        if (!firestoreUser) {
            firestoreUser = await createUser(userId);
        }
        setUser(firestoreUser);
        setLoading(false);

        // Setup real-time listener for future updates
        const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({
                    address: data.address,
                    chains: data.chains || [],
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    referralCode: data.referralCode,
                    referredBy: data.referredBy,
                    totalVolume: data.totalVolume || 0,
                    lastActive: data.lastActive?.toDate?.() || new Date(),
                    email: data.email,
                    displayName: data.displayName,
                    photoURL: data.photoURL,
                    preferences: data.preferences,
                } as User);
            }
        });

        userUnsubscribeRef.current = unsubscribe;
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                await setupUserListener(fbUser);
            } else {
                setUser(null);
                setLoading(false);
                // Clean up user listener
                if (userUnsubscribeRef.current) {
                    userUnsubscribeRef.current();
                    userUnsubscribeRef.current = null;
                }
            }
        });

        return () => {
            unsubscribe();
            if (userUnsubscribeRef.current) {
                userUnsubscribeRef.current();
            }
        };
    }, [setupUserListener]);

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
                refreshUser,
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
