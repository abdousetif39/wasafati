import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Settings } from '../types';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,
  
  fetchSettings: async () => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ settings: docSnap.data() as Settings, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error("Error fetching settings:", error); }
      set({ loading: false });
    }
  }
}));
