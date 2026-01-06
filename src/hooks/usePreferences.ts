import { useAuth } from '@/context/AuthContext';
import { defaultPreferences } from '@/lib/firebase/collections';
import { UserPreferences } from '@/types';

export function usePreferences(): UserPreferences {
    const { user } = useAuth();
    return user?.preferences || defaultPreferences;
}
