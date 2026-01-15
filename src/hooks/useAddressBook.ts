'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import type { AddressBookEntry, ChainId } from '@/types';

interface UseAddressBookReturn {
    addresses: AddressBookEntry[];
    isLoading: boolean;
    error: string | null;
    addAddress: (entry: Omit<AddressBookEntry, 'id' | 'userId' | 'createdAt'>) => Promise<string | null>;
    updateAddress: (id: string, updates: Partial<AddressBookEntry>) => Promise<boolean>;
    removeAddress: (id: string) => Promise<boolean>;
    getAddressByAddress: (address: string) => AddressBookEntry | undefined;
    markAsUsed: (id: string) => Promise<void>;
}

export function useAddressBook(): UseAddressBookReturn {
    const [addresses, setAddresses] = useState<AddressBookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const addressBookRef = collection(db, 'users', user.uid, 'addressBook');
        const q = query(addressBookRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const entries: AddressBookEntry[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: user.uid,
                        address: data.address,
                        name: data.name,
                        chain: data.chain,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        lastUsed: data.lastUsed?.toDate(),
                        isFavorite: data.isFavorite || false,
                    };
                });
                setAddresses(entries);
                setIsLoading(false);
            },
            (err) => {
                console.error('Address book subscription error:', err);
                setError('Failed to load address book');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addAddress = async (
        entry: Omit<AddressBookEntry, 'id' | 'userId' | 'createdAt'>
    ): Promise<string | null> => {
        const user = auth.currentUser;
        if (!user) {
            setError('Not authenticated');
            return null;
        }

        try {
            const addressBookRef = collection(db, 'users', user.uid, 'addressBook');
            const docRef = await addDoc(addressBookRef, {
                address: entry.address.toLowerCase(),
                name: entry.name,
                chain: entry.chain,
                isFavorite: entry.isFavorite || false,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (err) {
            console.error('Failed to add address:', err);
            setError('Failed to add address');
            return null;
        }
    };

    const updateAddress = async (
        id: string,
        updates: Partial<AddressBookEntry>
    ): Promise<boolean> => {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            const docRef = doc(db, 'users', user.uid, 'addressBook', id);
            const updateData: Record<string, any> = {};

            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.chain !== undefined) updateData.chain = updates.chain;
            if (updates.isFavorite !== undefined) updateData.isFavorite = updates.isFavorite;
            if (updates.address !== undefined) updateData.address = updates.address.toLowerCase();

            await updateDoc(docRef, updateData);
            return true;
        } catch (err) {
            console.error('Failed to update address:', err);
            return false;
        }
    };

    const removeAddress = async (id: string): Promise<boolean> => {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            const docRef = doc(db, 'users', user.uid, 'addressBook', id);
            await deleteDoc(docRef);
            return true;
        } catch (err) {
            console.error('Failed to remove address:', err);
            return false;
        }
    };

    const getAddressByAddress = (address: string): AddressBookEntry | undefined => {
        return addresses.find(
            (entry) => entry.address.toLowerCase() === address.toLowerCase()
        );
    };

    const markAsUsed = async (id: string): Promise<void> => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const docRef = doc(db, 'users', user.uid, 'addressBook', id);
            await updateDoc(docRef, { lastUsed: serverTimestamp() });
        } catch (err) {
            console.error('Failed to mark address as used:', err);
        }
    };

    return {
        addresses,
        isLoading,
        error,
        addAddress,
        updateAddress,
        removeAddress,
        getAddressByAddress,
        markAsUsed,
    };
}
