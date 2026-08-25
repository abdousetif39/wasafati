import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import { ChefHat, Users, BookOpen, Eye, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Recipe, User } from '../../types';

export default function Dashboard() {
    const [stats, setStats] = useState({
    totalRecipes: 0,
    publishedRecipes: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Recipes Stats
        const recipesSnapshot = await getDocs(collection(db, 'recipes'));
        const recipes = recipesSnapshot.docs.map(doc => doc.data() as Recipe);
        const publishedCount = recipes.filter(r => r.isPublished).length;
        const viewsCount = recipes.reduce((acc, recipe) => acc + (recipe.views || 0), 0);
        
        // Fetch Users Stats
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        setStats({
          totalRecipes: recipes.length,
          publishedRecipes: publishedCount,
          totalUsers: usersSnapshot.size,
          totalViews: viewsCount
        });

        // Fetch أحدث الوصفات
        const recentQuery = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(recentQuery);
        setRecentRecipes(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Recipe));
        
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching dashboard data:', error); }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'إجمالي الوصفات' , value: stats.totalRecipes, icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'منشورة' , value: stats.publishedRecipes, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'المشاهدات', value: stats.totalViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'عدد المستخدمين', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">أحدث الوصفات</h2>
            <Link to="/admin/recipes" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">عرض الكل<ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>)}
            </div>
          ) : recentRecipes.length > 0 ? (
            <div className="space-y-4">
              {recentRecipes.map(recipe => (
                <div key={recipe.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={recipe.mainImage} alt={recipe.title} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold text-slate-800">{recipe.title}</h3>
                      <p className="text-xs text-slate-500">{new Date(recipe.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${recipe.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {recipe.isPublished ? 'منشورة' : 'مسودات'}
                    </span>
                    <Link to={`/admin/recipes/edit/${recipe.id}`} className="p-2 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100 rounded-lg transition-colors">
                      <ArrowUpRight className="w-4 h-4 rtl:rotate-45" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">لا توجد وصفات</div>
          )}
        </div>

        <div className="bg-orange-600 p-8 rounded-3xl shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">إجراءات سريعة</h2>
            <p className="text-orange-100 text-sm mb-6">ماذا تريد أن تفعل اليوم؟</p>
            
            <div className="space-y-3">
              <Link to="/admin/recipes/new" className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl transition-colors backdrop-blur-sm font-medium">
                <ChefHat className="w-5 h-5" />إضافة وصفة جديدة</Link>
              <Link to="/admin/categories" className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl transition-colors backdrop-blur-sm font-medium">
                <BookOpen className="w-5 h-5" />التصنيفات</Link>
              <Link to="/admin/users" className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl transition-colors backdrop-blur-sm font-medium">
                <Users className="w-5 h-5" />مراجعة المستخدمين</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
