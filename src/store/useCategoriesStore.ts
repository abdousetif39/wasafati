import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category } from '../types';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  getCategorySlug: (id: string) => string;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  fetchCategories: async () => {
    if (get().categories.length > 0) return;
    set({ loading: true });
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      set({ categories: cats });
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching categories:', error); }
    } finally {
      set({ loading: false });
    }
  },
  getCategorySlug: (id: string) => {
    const cat = get().categories.find(c => c.id === id);
    return cat ? cat.slug : 'misc';
  }
}));
