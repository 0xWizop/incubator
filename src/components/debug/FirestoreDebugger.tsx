'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

export function FirestoreDebugger() {
    const { firebaseUser } = useAuth();
    const [status, setStatus] = useState<string>('Idle');
    const [error, setError] = useState<string | null>(null);

    const testWrite = async () => {
        if (!firebaseUser) {
            setStatus('Error: Not authenticated');
            return;
        }

        setStatus('Testing write...');
        setError(null);

        try {
            const testId = 'debug_' + Date.now();
            const ref = doc(collection(db, 'watchlists'), firebaseUser.uid);

            // Try reading first
            setStatus('Reading document...');
            const snap = await getDoc(ref);
            const exists = snap.exists();
            setStatus(`Read complete. Exists: ${exists}. Attempting write...`);

            // Try writing
            await setDoc(ref, {
                _debug_last_test: new Date().toISOString(),
                _debug_user_id: firebaseUser.uid
            }, { merge: true });

            setStatus('✅ Write successful! Database is connected and writable.');
        } catch (e: any) {
            console.error('Debug write failed:', e);
            setStatus('❌ Write Failed');
            setError(e.message || JSON.stringify(e));
        }
    };

    return (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg my-4">
            <h3 className="font-bold text-lg mb-2 text-white">Database Diagnostic</h3>
            <div className="mb-4">
                <p className="text-gray-300">User ID: <span className="font-mono text-yellow-400">{firebaseUser?.uid || 'Not signed in'}</span></p>
                <p className="text-gray-300">Status: <span className={status.includes('✅') ? 'text-green-400' : status.includes('❌') ? 'text-red-400' : 'text-blue-400'}>{status}</span></p>
                {error && (
                    <div className="mt-2 p-2 bg-red-900/50 text-red-200 text-sm font-mono overflow-auto rounded">
                        {error}
                    </div>
                )}
            </div>
            <button
                onClick={testWrite}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
            >
                Test Database Write
            </button>
        </div>
    );
}
