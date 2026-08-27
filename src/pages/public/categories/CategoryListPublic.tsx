import React, { useState, useEffect } from 'react';
import { useCategoriesStore } from '../../../store/useCategoriesStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Category } from '../../../types';
import { Link } from 'react-router-dom';
import { getResponsiveImageProps } from '../../../lib/cloudinary';
import { ArrowLeft } from 'lucide-react';

export default function CategoryListPublic() {
  const storeCategories = useCategoriesStore(state => state.categories);
  const loading = useCategoriesStore(state => state.loading);
  const categories = storeCategories.filter(c => c.isActive);
  
  


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5 rtl:rotate-180 transform" />
        <span>العودة للرئيسية</span>
      </Link>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4">التصنيفات</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">استكشف أشهى التصنيفات</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {categories.map(category => (
            <Link key={category.id} to={`/categories/${category.slug}`} className="group block">
              <div className="aspect-square rounded-3xl overflow-hidden mb-4 relative bg-slate-100 shadow-sm border border-slate-200">
                {category.imageUrl ? (
                  <>
                    <img
                      {...getResponsiveImageProps(category.imageUrl, 320)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
                      alt={category.name}
                      loading="lazy"
                      width="320"
                      height="320"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">لا توجد بيانات</div>
                )}
              </div>
              <h3 className="text-center font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors">{category.name}</h3>
              <p className="text-center text-sm text-slate-500 line-clamp-2 mt-1 px-2">{category.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-20 bg-white rounded-3xl border border-slate-200">لا توجد تصنيفات</div>
      )}
    </div>
  );
}
