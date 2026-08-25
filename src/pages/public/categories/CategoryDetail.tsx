import { optimizeCloudinaryUrl } from '../../../lib/cloudinary';
import { useCategoriesStore } from '../../../store/useCategoriesStore';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Recipe, Category } from '../../../types';
import { RecipeLink } from '../../../components/recipe/RecipeLink';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, ArrowLeft } from 'lucide-react';
import { AutoSEO } from '../../../components/seo/AutoSEO';

export default function CategoryDetail() {
    const { slug } = useParams<{ slug: string }>();
  const { getCategorySlug } = useCategoriesStore();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
    
  

  useEffect(() => {
    const fetchCategoryAndRecipes = async () => {
      try {
        if (!slug) {
          setLoading(false);
          return;
        }
        
        // Find category by slug
        const categoryQuery = query(collection(db, 'categories'), where('slug', '==', decodeURIComponent(slug || '')), where('isActive', '==', true), limit(1));
        const categorySnapshot = await getDocs(categoryQuery);
        
        if (categorySnapshot.empty) {
          navigate('/categories');
          return;
        }
        
        const categoryData = { id: categorySnapshot.docs[0].id, ...categorySnapshot.docs[0].data() } as Category;
        setCategory(categoryData);

        // Find recipes by categoryId
        const recipesQuery = query(collection(db, 'recipes'), where('categoryId', '==', categoryData.id), where('isPublished', '==', true));

        const recipesSnapshot = await getDocs(recipesQuery);
        const recipesData = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recipe[];
        
        setRecipes(recipesData);
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching data:', error); }
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndRecipes();
  }, [slug, navigate]);

  if (loading ) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          
        </div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AutoSEO category={category || category} type="website" />
      <div className="mb-12">
        <Link to="/categories" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />العودة للتصنيفات</Link>
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          {category.imageUrl && (
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
              <img src={category?.imageUrl || category.imageUrl} alt={category?.name || category.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 text-center md:text-start">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">{category?.name || category.name}</h1>
            <p className="text-slate-500 text-lg max-w-2xl">{category?.description || category.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-slate-800">وصفات التصنيف ({recipes.length})</h2>
      </div>

      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map(recipe => (
            <RecipeLink key={recipe.id} recipe={recipe} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        <div className="text-center text-slate-500 py-20 bg-white rounded-3xl border border-slate-200">لا توجد وصفات</div>
      )}
    </div>
  );
}
