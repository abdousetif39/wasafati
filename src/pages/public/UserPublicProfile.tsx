import { optimizeCloudinaryUrl } from '../../lib/cloudinary';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RecipeLink } from '../../components/recipe/RecipeLink';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { generateUniqueProfileSlug } from '../../lib/slug';
import { SEO } from '../../components/seo/SEO';
import { User, Recipe } from '../../types';
import { MapPin, Utensils, Clock, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate, useNavigate } from 'react-router-dom';

export default function UserPublicProfile() {
  const { profileSlug } = useParams<{ profileSlug: string }>();
  const { getCategorySlug } = useCategoriesStore();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    async function fetchProfile() {
      if (!profileSlug) {
        setLoading(false);
        return;
      }
      try {
        let foundUser: User | null = null;
        let actualUserId = '';

        // 1. Try fetching by profileSlug
        const decodedProfileSlug = decodeURIComponent(profileSlug || '');
        const slugQuery = query(collection(db, 'publicProfiles'), where('profileSlug', '==', decodedProfileSlug));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          foundUser = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() } as User;
          actualUserId = slugSnap.docs[0].id;
        } else {
                    // 2. Try fetching by doc ID (for backward compatibility)
          const docRef = doc(db, 'publicProfiles', profileSlug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profileSlug) {
              navigate(`/profile/${data.profileSlug}`, { replace: true });
              return;
            } else {
              // Auto-generate profileSlug for legacy user
              const newSlug = await generateUniqueProfileSlug(data.displayName || 'user', docSnap.id);
              await updateDoc(docRef, { profileSlug: newSlug });
              navigate(`/profile/${newSlug}`, { replace: true });
              return;
            }
          }
        }

        if (foundUser) {
          setProfileUser(foundUser);
          const q = query(
            collection(db, 'recipes'),
            where('authorId', '==', actualUserId),
            where('isPublished', '==', true)
          );
          const recipesSnap = await getDocs(q);
          const fetchedRecipes = recipesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
          setRecipes(fetchedRecipes);
        }
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error("Error fetching profile:", error); }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [profileSlug, navigate]);


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">المستخدم غير موجود</h2>
          <Link to="/" className="text-orange-600 hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const initial = profileUser.displayName ? profileUser.displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEO 
        title={`الملف الشخصي - ${profileUser.displayName}`} 
        canonical={`${window.location.origin}/profile/${profileUser.profileSlug || profileUser.id}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": profileUser.displayName,
          "url": `${window.location.origin}/profile/${profileUser.profileSlug || profileUser.id}`,
          "image": profileUser.photoURL || undefined
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-8 text-center flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 text-4xl font-bold mb-4 shadow-sm">
            {profileUser.photoURL ? (
              <img src={profileUser.photoURL} alt={profileUser.displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{profileUser.displayName}</h1>
          {(profileUser.wilaya || profileUser.municipality) && (
            <p className="text-slate-500 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              {profileUser.wilaya}{profileUser.municipality ? ` - ${profileUser.municipality}` : ''}
            </p>
          )}
          {profileUser.phone && (
            <p className="text-slate-600 flex items-center justify-center gap-2 mt-2" dir="ltr">
               <span className="font-bold">{profileUser.phone}</span> 📞
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
             <Utensils className="w-5 h-5 text-orange-600" />
             <span className="font-bold">{recipes.length}</span> وصفات منشورة
          </div>
        </div>

        {/* Recipes */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">وصفات {profileUser.displayName}</h2>
          {recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <RecipeLink key={recipe.id} recipe={recipe} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{recipe.shortDescription}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.totalTime} دقيقة</div>
                      <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {recipe.servings} أشخاص</div>
                    </div>
                  </div>
                </RecipeLink>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              لا توجد وصفات منشورة حتى الآن.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
