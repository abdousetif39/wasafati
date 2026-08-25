import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Recipe } from '../../types';

interface RecipeLinkProps {
  recipe: Recipe;
  className?: string;
  children: React.ReactNode;
}

export const RecipeLink: React.FC<RecipeLinkProps> = ({ recipe, className, children }) => {
  const categories = useCategoriesStore(state => state.categories);
  const [catSlug, setCatSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!recipe || !recipe.categoryId) return;
    const cat = categories.find(c => c.id === recipe.categoryId);
    if (cat) {
      setCatSlug(cat.slug);
    } else {
      // Fetch it if not found in store
      getDoc(doc(db, 'categories', recipe.categoryId)).then(docSnap => {
        if (docSnap.exists()) {
          setCatSlug(docSnap.data().slug);
        } else {
          setCatSlug('uncategorized'); // Fallback if category actually doesn't exist
        }
      }).catch(() => {
        setCatSlug('uncategorized');
      });
    }
  }, [recipe, categories]);

  // If we don't have the category slug yet, we can fallback to the old /recipes/:slug URL
  // which is correctly handled by RecipeDetail to redirect to the new URL once loaded.
  const toUrl = catSlug 
    ? `/categories/${catSlug}/${recipe.slug}` 
    : `/recipes/${recipe.slug}`;

  return (
    <Link to={toUrl} className={className}>
      {children}
    </Link>
  );
};
