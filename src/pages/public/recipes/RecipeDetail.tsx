import { optimizeCloudinaryUrl } from '../../../lib/cloudinary';
import { PrintModal } from '../../../components/recipe/PrintModal';
import { AutoSEO } from '../../../components/seo/AutoSEO';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { AdSenseSlot } from '../../../components/ads/AdSenseSlot';
import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getResponsiveImageProps } from '../../../lib/cloudinary';
import { useCategoriesStore } from '../../../store/useCategoriesStore';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, updateDoc, increment , limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Recipe, Category, User } from '../../../types';
import { Clock, Users, Flame, Printer, Share2, Heart, Printer as PrinterIcon, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';

export default function RecipeDetail() {
  const toast = useToast();
  const [translatedRecipe, setTranslatedRecipe] = useState<Recipe | null>(null);
  const [translating, setTranslating] = useState(false);
  const { settings } = useSettingsStore();

  const { categorySlug, recipeSlug, slug } = useParams();
  const navigate = useNavigate();
  const { getCategorySlug } = useCategoriesStore();
      
  const { user, isAdmin } = useAuthStore();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  useEffect(() => { if(recipe) setActiveImage(recipe.mainImage); }, [recipe]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!slug && !recipeSlug) {
        setRecipe(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        console.log("ROUTE PARAMS:", { categorySlug, recipeSlug, slug }); const decodedCategorySlug = categorySlug ? decodeURIComponent(categorySlug) : '';
        const decodedRecipeSlug = recipeSlug ? decodeURIComponent(recipeSlug) : decodeURIComponent(slug || '');
        
        let categoryId = null;
        
        // If categorySlug is present, fetch the category first
        if (decodedCategorySlug) {
           const catQuery = query(collection(db, 'categories'), where('slug', '==', decodedCategorySlug), limit(1));
           const catSnap = await getDocs(catQuery);
           if (!catSnap.empty) {
             categoryId = catSnap.docs[0].id;
           } else {
             // Category not found
             setRecipe(null);
             setLoading(false);
             return;
           }
        }

        let q = query(collection(db, 'recipes'), where('slug', '==', decodedRecipeSlug), limit(1));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (e: any) {
          if (e.code === 'permission-denied') {
             // If permission denied, it's because the user is not admin and the query didn't specify isPublished=true
             q = query(collection(db, 'recipes'), where('slug', '==', decodedRecipeSlug), where('isPublished', '==', true), limit(1));
             snapshot = await getDocs(q);
             
             // If it's still empty and they are logged in, maybe it's their own draft?
             if (snapshot.empty && user) {
                const qOwn = query(collection(db, 'recipes'), where('slug', '==', decodedRecipeSlug), where('authorId', '==', user.id), limit(1));
                snapshot = await getDocs(qOwn);
             }
          } else {
             throw e;
          }
        }
        
        // If not found by slug, check previousSlugs
        if (snapshot.empty) {
          let qPrev = query(collection(db, 'recipes'), where('previousSlugs', 'array-contains', decodedRecipeSlug), limit(1));
          try {
            snapshot = await getDocs(qPrev);
          } catch (e: any) {
            if (e.code === 'permission-denied') {
               qPrev = query(collection(db, 'recipes'), where('previousSlugs', 'array-contains', decodedRecipeSlug), where('isPublished', '==', true), limit(1));
               snapshot = await getDocs(qPrev);
               if (snapshot.empty && user) {
                  const qPrevOwn = query(collection(db, 'recipes'), where('previousSlugs', 'array-contains', decodedRecipeSlug), where('authorId', '==', user.id), limit(1));
                  snapshot = await getDocs(qPrevOwn);
               }
            } else {
               throw e;
            }
          }
        }

        if (snapshot.empty) {
          setRecipe(null);
        } else {
          const docSnap = snapshot.docs[0];
          const recipeData = docSnap.data() as Recipe;
          
          if (!isAdmin && !recipeData.isPublished && recipeData.authorId !== user?.id) {
            setRecipe(null);
            setLoading(false);
            return;
          }

          // If categoryId was found from URL, enforce it matches recipe
          if (categoryId && recipeData.categoryId !== categoryId) {
            setRecipe(null);
            setLoading(false);
            return;
          }
          
          // If old URL (/recipes/:slug) OR if found via previousSlugs, redirect to new URL
          if (!categorySlug || decodedRecipeSlug !== recipeData.slug) {
             let cSlug = getCategorySlug(recipeData.categoryId);
             if (!cSlug || cSlug === 'misc') {
               const catDocRef = await getDoc(doc(db, 'categories', recipeData.categoryId));
               if (catDocRef.exists()) {
                 cSlug = catDocRef.data().slug;
               } else {
                 cSlug = 'uncategorized';
               }
             }
             navigate(`/categories/${cSlug}/${recipeData.slug}`, { replace: true });
             return;
          }

          setRecipe({ id: docSnap.id, ...recipeData });

          // Record view count
          try {
            await updateDoc(docSnap.ref, {
              views: increment(1)
            });
          } catch (e) {
            if ((e as any)?.code !== 'permission-denied') { console.error('Error incrementing views:', e); }
          }

          // Fetch category
          if (recipeData.categoryId) {
            const catDoc = await getDoc(doc(db, 'categories', recipeData.categoryId));
            if (catDoc.exists()) {
              setCategory({ id: catDoc.id, ...catDoc.data() } as Category);
            }
          }

          // Fetch author
          if (recipeData.authorId) {
            try {
              const authorDoc = await getDoc(doc(db, 'publicProfiles', recipeData.authorId));
              if (authorDoc.exists()) {
                setAuthor({ id: authorDoc.id, ...authorDoc.data() } as User);
              } else if (recipeData.authorRole === 'admin') {
                // Mock author for admin without public profile
                setAuthor({ id: recipeData.authorId, displayName: 'الإدارة', role: 'admin' } as User);
              } else {
                setAuthor({ id: recipeData.authorId, displayName: 'مستخدم', role: 'user' } as User);
              }
            } catch (e) {
              console.warn("Could not fetch author profile");
            }
          }

          // Check if favorited
          if (user?.id) {
             const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.id), where('recipeId', '==', docSnap.id));
             const favSnap = await getDocs(favQuery);
             setIsFavorite(!favSnap.empty);
          }
        }
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching recipe:', error); }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [categorySlug, recipeSlug, slug, user, isAdmin, navigate, getCategorySlug]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('حدث خطأ');
      return;
    }
    if (!recipe) return;

    try {
      if (isFavorite && favoriteId) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
        toast.success('تم بنجاح');
      } else {
        const docRef = await addDoc(collection(db, 'favorites'), {
          userId: user.id,
          recipeId: recipe.id,
          createdAt: new Date().toISOString()
        });
        setIsFavorite(true);
        setFavoriteId(docRef.id);
        toast.success('تم بنجاح');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div></div>;
  if (!recipe) return <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50"><h1 className="text-2xl font-bold text-slate-800">الوصفة غير موجودة</h1><Link to="/recipes"><Button>العودة للوصفات</Button></Link></div>;

  const difficultyMap = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
  };

    const handlePrint = () => { setIsPrintModalOpen(true); };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم بنجاح');
    }
  };

  
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": recipe.seoTitle || recipe.title || '',
    "image": [
      recipe.socialImage || recipe.mainImage
    ],
    "author": author ? {
      "@type": "Person",
      "name": author.displayName,
      "url": window.location.origin + `/profile/${author.profileSlug || author.id}`,
      "image": author.photoURL || undefined
    } : {
      "@type": "Organization",
      "name": settings?.siteName || "وصفاتي"
    },
    "datePublished": recipe.createdAt,
    "description": recipe.seoDescription || recipe.shortDescription || '',
    "prepTime": `PT${recipe.prepTime || 0}M`,
    "cookTime": `PT${recipe.cookTime || 0}M`,
    "totalTime": `PT${(recipe.prepTime || 0) + (recipe.cookTime || 0)}M`,
    "recipeYield": `${recipe.servings || 4} servings`,
    "recipeIngredient": recipe.ingredients?.map(ing => `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()),
    "recipeInstructions": recipe.steps?.map(step => ({
      "@type": "HowToStep",
      "name": step.title || '',
      "text": step.description || ''
    }))
  };

  return (
    <>
       <AutoSEO 
        recipe={recipe} 
        category={category || undefined} 
        type="recipe" 
        authorName={author?.displayName}
        authorUrl={author?.profileSlug ? `${window.location.origin}/profile/${author.profileSlug}` : undefined}
        authorPhotoUrl={author?.photoURL}
      />
    <article className="bg-slate-50 min-h-screen pb-20">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:hidden">
        <Link to="/recipes" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-6 font-medium transition-colors print-hidden">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180 transform" />
          <span>العودة للوصفات</span>
        </Link>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 mb-8 print:border-none print:shadow-none print:rounded-none">
          <div className="aspect-video w-full relative bg-slate-100">
            <img 
              {...getResponsiveImageProps(activeImage || recipe.mainImage, 800)} 
              sizes="(max-width: 1024px) 100vw, 800px"
              alt={recipe.title} 
              width="800"
              height="533"
              className="w-full h-full object-contain"
            />
            
            {recipe.gallery && recipe.gallery.length > 0 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {[recipe.mainImage, ...recipe.gallery].map((img, idx) => (
                  <div key={idx} onClick={() => setActiveImage(img)} className="w-16 h-16 rounded-lg border-2 border-white overflow-hidden shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <img 
                      {...getResponsiveImageProps(img, 150)} 
                      alt={`Gallery ${idx}`} 
                      loading="lazy"
                      width="150"
                      height="150"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 md:p-10">
            {category && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-4">
                {category?.name}
              </span>
            )}
            
            {author ? (
              author.profileSlug ? (
                <Link to={`/profile/${author.profileSlug}`} className="flex items-center gap-3 mb-6 bg-white p-2 pr-4 rounded-full w-fit shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                  {author.photoURL ? (
                    <img 
                      {...getResponsiveImageProps(author.photoURL, 40)} 
                      alt={author.displayName} 
                      loading="lazy"
                      width="40"
                      height="40"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                      {author.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-right">
                    <span className="block text-xs text-slate-500 mb-0.5">أضيفت بواسطة</span>
                    <span className="font-bold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">{author.displayName}</span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 mb-6 bg-white p-2 pr-4 rounded-full w-fit shadow-sm border border-slate-100">
                  {author.photoURL ? (
                    <img 
                      {...getResponsiveImageProps(author.photoURL, 40)} 
                      alt={author.displayName} 
                      loading="lazy"
                      width="40"
                      height="40"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                      {author.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-right">
                    <span className="block text-xs text-slate-500 mb-0.5">أضيفت بواسطة</span>
                    <span className="font-bold text-slate-800 text-sm">{author.displayName}</span>
                  </div>
                </div>
              )
            ) : null}

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight break-words">
              {recipe.title}
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {recipe.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-100 mb-8">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl">
                <Clock className="w-6 h-6 text-slate-500 mb-2" />
                <span className="text-sm text-slate-500">وقت التحضير</span>
                <span className="font-bold text-slate-900">{recipe.prepTime} دقيقة</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl">
                <Flame className="w-6 h-6 text-slate-500 mb-2" />
                <span className="text-sm text-slate-500">وقت الطبخ</span>
                <span className="font-bold text-slate-900">{recipe.cookTime} دقيقة</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl">
                <Users className="w-6 h-6 text-slate-500 mb-2" />
                <span className="text-sm text-slate-500">الحصص</span>
                <span className="font-bold text-slate-900">{recipe.servings * servingMultiplier}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full ${recipe.difficulty === 'easy' ? 'bg-green-500' : recipe.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <span className="text-sm text-slate-500">الصعوبة</span>
                <span className="font-bold text-slate-900">{difficultyMap[recipe.difficulty]}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 print-hidden">
              <Button variant="outline" onClick={toggleFavorite} className={`flex-1 md:flex-none ${isFavorite ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300' : ''}`}>
                <Heart className={`w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 ${isFavorite ? 'fill-current' : ''}`} /> {isFavorite ? 'محفوظة في المفضلة' : 'حفظ في المفضلة'}
              </Button>
              <Button variant="outline" type="button" onClick={handlePrint} className="flex-1 md:flex-none print-hidden">
                <PrinterIcon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />طباعة</Button>
              <Button variant="outline" onClick={handleShare} className="flex-1 md:flex-none">
                <Share2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />مشاركة</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">المكونات</h2>
              </div>
              
              <div className="flex items-center justify-between bg-orange-50 p-4 rounded-2xl mb-6 print-hidden">
                <span className="font-medium text-orange-900">تعديل الحصص</span>
                <div className="flex items-center gap-4 bg-white rounded-xl p-1 shadow-sm border border-orange-100">
                  <button 
                    onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                    className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold"
                  >-</button>
                  <span className="font-bold text-slate-900 w-4 text-center">{servingMultiplier}x</span>
                  <button 
                    onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                    className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold"
                  >+</button>
                </div>
              </div>

              <ul className="space-y-4">
                {recipe.ingredients.map((ing, i) => {
                  // Basic number extraction for scaling (very simplistic)
                  const baseQty = parseFloat(ing.quantity);
                  const displayQty = !isNaN(baseQty) ? (baseQty * servingMultiplier).toString() : ing.quantity;
                  
                  return (
                    <li key={i} className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-slate-700 font-medium text-lg">{ing.name}</span>
                        {(displayQty || ing.unit) && (
                          <span className="text-slate-500 font-medium mx-2 inline-flex items-center gap-1" dir="auto">
                            - {displayQty} {ing.unit}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">الخطوات</h2>
              
              <div className="space-y-8">
                {recipe.steps.sort((a,b) => a.stepNumber - b.stepNumber).map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0">
                        {step.stepNumber}
                      </div>
                      {i !== recipe.steps.length - 1 && <div className="w-px h-full bg-slate-100 my-2"></div>}
                    </div>
                    <div className="pb-8">
                      {step.imageUrl && (
                        <img 
                          {...getResponsiveImageProps(step.imageUrl, 400)} 
                          alt={step.title || 'Step ' + step.stepNumber} 
                          loading="lazy"
                          width="400"
                          height="300"
                          className="w-full max-w-sm h-auto rounded-xl mb-4 object-cover shadow-sm"
                        />
                      )}
                      {(step.title) && (
                        <h3 className="text-xl font-bold text-slate-900 mb-3">
                          {step.title}
                        </h3>
                      )}
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      
    
      {/* Dedicated Print View */}
      <div className="hidden print:block recipe-print-area" dir="rtl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{settings?.siteName || 'وصفاتي'}</h1>
          <div className="border-b-2 border-slate-200 mb-6"></div>
          <h2 className="text-3xl font-bold mb-4">{recipe.title}</h2>
          {recipe.mainImage && (
            <img 
              {...getResponsiveImageProps(recipe.mainImage, 800)} 
              sizes="(max-width: 1024px) 100vw, 800px"
              alt={recipe.title} 
              fetchPriority="high"
              width="800"
              height="533"
              className="w-full max-w-2xl mx-auto h-auto rounded-lg mb-6 shadow-sm object-cover"
            />
          )}
          <p className="text-lg text-slate-700 mb-6">{recipe.description}</p>
        </div>

        <div className="flex justify-between border-y border-slate-200 py-4 mb-8 text-center">
          <div><strong className="block text-slate-500 text-sm">وقت التحضير</strong>{recipe.prepTime} دقيقة</div>
          <div><strong className="block text-slate-500 text-sm">وقت الطبخ</strong>{recipe.cookTime} دقيقة</div>
          <div><strong className="block text-slate-500 text-sm">الحصص</strong>{recipe.servings}</div>
          <div><strong className="block text-slate-500 text-sm">الصعوبة</strong>{
            recipe.difficulty === 'easy' ? 'سهل' : recipe.difficulty === 'medium' ? 'متوسط' : 'صعب'
          }</div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b">المكونات</h3>
          <ul className="list-disc list-inside text-lg space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{!isNaN(parseFloat(ing.quantity)) ? (parseFloat(ing.quantity) * servingMultiplier).toString() : ing.quantity} {ing.unit} {ing.name}</li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b">طريقة التحضير</h3>
          <ol className="list-decimal list-inside text-lg space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="pl-4">
                {step.title && <strong>{step.title}: </strong>}
                {step.description}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-sm text-slate-600 flex flex-col items-end">
          {author && (
            <>
              <p><strong>أضيفت بواسطة:</strong> {author.displayName}</p>
              {author.wilaya && <p><strong>الولاية:</strong> {author.wilaya}</p>}
              {author.municipality && <p><strong>البلدية:</strong> {author.municipality}</p>}
            </>
          )}
        </div>
      </div>

      <PrintModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        recipe={recipe}
        authorName={author?.displayName}
        wilaya={author?.wilaya}
        municipality={author?.municipality}
      />

    </article>
    </>
  );
}
