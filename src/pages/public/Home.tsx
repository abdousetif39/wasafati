import { optimizeCloudinaryUrl } from '../../lib/cloudinary';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { SEO } from '../../components/seo/SEO';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AdSenseSlot } from '../../components/ads/AdSenseSlot';
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Recipe, Category } from '../../types';
import { RecipeLink } from '../../components/recipe/RecipeLink';
import { Link, useNavigate } from 'react-router-dom';
import { getResponsiveImageProps } from '../../lib/cloudinary';
import { Clock, Users, ArrowLeft, Search, Image as ImageIcon, Share2, Facebook, Twitter, MessageCircle, Link as LinkIcon } from 'lucide-react';

export default function Home() {
  const { settings } = useSettingsStore();

    const { getCategorySlug } = useCategoriesStore();
  const navigate = useNavigate();
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const storeCategories = useCategoriesStore(state => state.categories);
  const categories = storeCategories.filter(c => c.isActive).slice(0, 8);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch featured recipes
        const qRecipes = query(collection(db, 'recipes'), where('isFeatured', '==', true), limit(20));
        const recipeSnap = await getDocs(qRecipes);
        const allPub = recipeSnap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
        setFeaturedRecipes(allPub.filter(r => r.isPublished).slice(0, 6));

        // Fetch active categories
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error("Error fetching home data:", error); }
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  
  const handleShareSite = async () => {
    const shareData = {
      title: settings?.siteName || 'وصفاتي',
      text: settings?.description || 'أفضل الوصفات لجميع الأذواق',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // We could show a toast here if imported
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 overflow-hidden shadow-lg mx-4 mt-8 lg:mx-auto max-w-5xl">
        <div className="absolute inset-0 z-0">
          <img 
            key={settings?.heroImage || "fallback"} 
            {...getResponsiveImageProps(settings?.heroImage || "https://images.unsplash.com/photo-1495195134817-a1a288965631?q=80&w=2070&auto=format&fit=crop", 1200)} 
            sizes="(max-width: 1024px) 100vw, 1024px"
            alt="" 
            className="w-full h-full object-cover mix-blend-overlay opacity-40"
            fetchPriority="high"
            width="1024"
            height="400"
          />
        </div>
        
        <div className="relative z-10 p-10 md:p-14 flex flex-col justify-center text-center max-w-2xl mx-auto text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">أهلاً بك في وصفاتي</h1>
          <p className="text-orange-50 mb-8 text-lg">أفضل الوصفات لجميع الأذواق</p>
          
          <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md p-2 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center shadow-sm max-w-2xl mx-auto border border-white/20 w-full gap-2">
            <input type="text" id="search" name="search" aria-label="بحث" placeholder="ابحث عن وصفة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent outline-none text-white placeholder-orange-100 min-w-0"
            />
            <button type="submit" className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
              <Search className="w-5 h-5" />بحث</button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-white/20 flex flex-col items-center gap-4">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> شارك الموقع مع أصدقائك
            </span>
            <div className="flex gap-3">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110" aria-label="Share on Facebook">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(settings?.description || 'اكتشف أفضل الوصفات')}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110" aria-label="Share on Twitter">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent((settings?.description || 'اكتشف أفضل الوصفات') + ' ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110" aria-label="Share on WhatsApp">
                <MessageCircle className="w-5 h-5 text-white" />
              </a>
              <button onClick={handleShareSite} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110" aria-label="Copy link">
                <LinkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <AdSenseSlot slot={settings?.adsSlotHome || ""} />
      </div>

      {/* Categories */}
      <section className="mt-16 max-w-5xl mx-auto px-4 lg:px-0">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">أشهر التصنيفات</h3>
            <p className="text-sm text-slate-500">استكشف أشهى التصنيفات</p>
          </div>
          <Link to="/categories" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group" aria-label="عرض كل التصنيفات"><span aria-hidden="true">عرض الكل</span><ArrowLeft className="w-4 h-4 rtl:rotate-180 transform group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
           <div className="flex gap-4 overflow-hidden"><div className="w-32 h-32 bg-slate-100 rounded-2xl animate-pulse"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map(category => (
              <Link key={category.id} to={`/categories/${category.slug}`} className="group text-center">
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative bg-slate-100 border border-slate-100">
                  {category.imageUrl ? (
                    <img
                      {...getResponsiveImageProps(category.imageUrl, 320)}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 160px"
                      alt={category.name}
                      loading="lazy"
                      width="320"
                      height="320"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{category.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <AdSenseSlot slot={settings?.adsSlotHome || ""} />
      </div>

      {/* Featured Recipes */}
      <section className="mt-16 max-w-5xl mx-auto px-4 lg:px-0">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">وصفات مميزة</h3>
            <p className="text-sm text-slate-500">أحدث الوصفات</p>
          </div>
          <Link to="/recipes" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group" aria-label="عرض كل التصنيفات"><span aria-hidden="true">عرض الكل</span><ArrowLeft className="w-4 h-4 rtl:rotate-180 transform group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : featuredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRecipes.map(recipe => (
              <RecipeLink key={recipe.id} recipe={recipe} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col">
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  {recipe.mainImage ? (
                    <img
                      {...getResponsiveImageProps(recipe.mainImage, 640)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
                      alt={recipe.title}
                      loading="lazy"
                      width="640"
                      height="426"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-700">
                      {categories.find(c => c.id === recipe.categoryId)?.['name'] || 'الوصفة'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">{recipe.title}</h4>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
                    {recipe.shortDescription}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.totalTime} دقيقة</div>
                    <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {recipe.servings} الحصص</div>
                  </div>
                </div>
              </RecipeLink>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-20 bg-white rounded-2xl border border-slate-100">لا توجد بيانات</div>
        )}
      </section>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <AdSenseSlot slot={settings?.adsSlotHome || ""} />
      </div>
    </div>
  );
}
