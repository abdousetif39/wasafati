import { useCategoriesStore } from '../../../store/useCategoriesStore';
import { optimizeCloudinaryUrl } from '../../../lib/cloudinary';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Recipe, Category } from '../../../types';
import { Link } from 'react-router-dom';
import { RecipeLink } from '../../../components/recipe/RecipeLink';
import { Clock, Users, Search, ArrowLeft } from 'lucide-react';

export default function RecipeListPublic() {
  const { getCategorySlug } = useCategoriesStore();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), where('isActive', '==', true)));
        const catsData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(catsData);

        let q = query(collection(db, 'recipes'), where('isPublished', '==', true));

        const snapshot = await getDocs(q);
        let recipesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recipe[];
        recipesData.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        
        setRecipes(recipesData);
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching data:', error); }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = activeCategory === 'all' || recipe.categoryId === activeCategory;
    const matchesSearch = 
      (recipe.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (recipe.shortDescription || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5 rtl:rotate-180 transform" />
        <span>العودة للرئيسية</span>
      </Link>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4">الوصفات</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">أفضل الوصفات لجميع الأذواق</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="relative flex-1 max-w-md">
          <input type="text" id="search" name="search" aria-label="بحث" placeholder="بحث" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
          />
          <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
              activeCategory === 'all' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >الكل</button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                activeCategory === category.id 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeLink key={recipe.id} recipe={recipe} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <span className="text-xs font-bold text-slate-700">
                    {categories.find(c => c.id === recipe.categoryId)?.name || 'الوصفة'}
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
        <div className="text-center text-slate-500 py-20 bg-white rounded-3xl border border-slate-200">لا توجد نتائج</div>
      )}
    </div>
  );
}
