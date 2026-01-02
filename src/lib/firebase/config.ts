import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is valid
const app = getApps().length > 0 ? getApp() : (
    firebaseConfig.apiKey ? initializeApp(firebaseConfig) : initializeApp({
        apiKey: "demo-key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo-project",
    })
);

// Initialize services with safe fallbacks or just standard init (the "demo-key" might cause auth to fail on usage but not on init usually)
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
