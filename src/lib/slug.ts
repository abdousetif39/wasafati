export function generateSlug(text: string): string {
  if (!text) return '';
  
  // 1. Remove diacritics (tashkeel)
  let slug = text.replace(/[\u064B-\u065F]/g, '');
  
  // 2. To lowercase
  slug = slug.toLowerCase();

  // 3. Remove non-alphanumeric characters (keep Arabic, English, numbers, spaces, and hyphens)
  slug = slug.replace(/[^\w\u0600-\u06FF\s-]/g, '');

  // 4. Replace spaces and multiple hyphens with a single hyphen
  slug = slug.replace(/[\s_-]+/g, '-');

  // 5. Trim hyphens from start and end
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function generateUniqueSlug(baseText: string, collectionName: string, currentDocId?: string, userId?: string): Promise<string> {
  let baseSlug = generateSlug(baseText);
  if (!baseSlug) {
    baseSlug = 'item';
  }

  let slug = baseSlug;
  let counter = 2;
  let isUnique = false;

  while (!isUnique) {
    try {
      const q = query(collection(db, collectionName), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty || (snapshot.docs.length === 1 && snapshot.docs[0].id === currentDocId)) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    } catch (error: any) {
      // If permission denied (e.g. non-admin querying recipes), fallback to published and owned
      if (error.code === 'permission-denied' && collectionName === 'recipes') {
        const qPub = query(collection(db, collectionName), where('slug', '==', slug), where('isPublished', '==', true));
        const snapPub = await getDocs(qPub);
        
        let snapOwnEmpty = true;
        let snapOwnId = null;
        if (userId) {
            const qOwn = query(collection(db, collectionName), where('slug', '==', slug), where('authorId', '==', userId));
            const snapOwn = await getDocs(qOwn);
            snapOwnEmpty = snapOwn.empty;
            if (!snapOwn.empty) {
                snapOwnId = snapOwn.docs[0].id;
            }
        }
        
        const pubEmpty = snapPub.empty;
        const pubId = !pubEmpty ? snapPub.docs[0].id : null;
        
        if (
            (pubEmpty && snapOwnEmpty) || 
            (pubId === currentDocId && snapOwnEmpty) ||
            (pubEmpty && snapOwnId === currentDocId) ||
            (pubId === currentDocId && snapOwnId === currentDocId)
        ) {
            isUnique = true;
        } else {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
      } else {
        // If some other error, just append the counter
        slug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 10) isUnique = true;
      }
    }
  }

  return slug;
}


export async function generateUniqueProfileSlug(baseText: string, currentUserId?: string): Promise<string> {
  let baseSlug = generateSlug(baseText);
  if (!baseSlug) {
    baseSlug = 'user';
  }
  let slug = baseSlug;
  let counter = 2;
  let isUnique = false;

  while (!isUnique) {
    try {
      const q = query(collection(db, 'publicProfiles'), where('profileSlug', '==', slug));
      const snapshot = await getDocs(q);

      if (snapshot.empty || (snapshot.docs.length === 1 && snapshot.docs[0].id === currentUserId)) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    } catch (error: any) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 10) isUnique = true;
    }
  }

  return slug;
}
