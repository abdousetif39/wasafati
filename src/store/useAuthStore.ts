import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  setUser: (user: User | null, firebaseUser: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

let authListenerUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  isAdmin: false,
  isInitialized: false,
  
  setUser: (user, firebaseUser) => set({ 
    user, 
    firebaseUser, 
    isAdmin: user?.role === 'admin' 
  }),
  
  setLoading: (loading) => set({ loading }),
  
  logout: async () => {
    set({ loading: true });
    try {
      await firebaseSignOut(auth);
      // Let the onAuthStateChanged listener handle state update to null.
      // But we can also proactively clear it.
      set({ user: null, firebaseUser: null, isAdmin: false, loading: false });
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error('Logout error:', error); }
      set({ loading: false });
    }
  },
  
  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    if (authListenerUnsubscribe) {
        authListenerUnsubscribe();
    }

    authListenerUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            // Sync public profile
            try {
              const { setDoc } = await import('firebase/firestore');
              const { generateUniqueProfileSlug } = await import('../lib/slug');
              const publicProfileRef = doc(db, 'publicProfiles', firebaseUser.uid);
              const publicProfileSnap = await getDoc(publicProfileRef);
              
              let profileSlug = publicProfileSnap.exists() ? publicProfileSnap.data().profileSlug : undefined;
              
              if (!profileSlug) {
                 profileSlug = await generateUniqueProfileSlug(userData.displayName || 'user', firebaseUser.uid);
              }
              
              await setDoc(publicProfileRef, {
                displayName: userData.displayName || '',
                photoURL: userData.photoURL || '',
                wilaya: userData.wilaya || '',
                municipality: userData.municipality || '',
                profileSlug
              }, { merge: true });
            } catch (syncErr) {
              if ((syncErr as any)?.code !== 'permission-denied') { console.error('Error syncing public profile:', syncErr); }
            }

            set({ 
              user: { id: userDoc.id, ...userData }, 
              firebaseUser,
              isAdmin: userData.role === 'admin',
              loading: false,
              isInitialized: true
            });
          } else {
            set({ user: null, firebaseUser, isAdmin: false, loading: false, isInitialized: true });
          }
        } catch (error) {
          if ((error as any)?.code !== 'permission-denied') { console.error("Error fetching user data:", error); }
          set({ user: null, firebaseUser: null, isAdmin: false, loading: false, isInitialized: true });
        }
      } else {
        set({ user: null, firebaseUser: null, isAdmin: false, loading: false, isInitialized: true });
      }
    });
  }
}));
