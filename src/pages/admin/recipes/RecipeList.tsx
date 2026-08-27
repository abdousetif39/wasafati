import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Recipe, Category } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Plus, Edit2, Trash2, Utensils, Eye, EyeOff, Search } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Link } from 'react-router-dom';

export default function RecipeList() {
  const toast = useToast();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [authorUsers, setAuthorUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch categories for mapping IDs to names
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const catsMap: Record<string, Category> = {};
      snapshot.forEach(doc => {
        catsMap[doc.id] = { id: doc.id, ...doc.data() } as Category;
      });
      setCategories(catsMap);
    });

    const q = query(collection(db, 'recipes'));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersMap: Record<string, any> = {};
      snapshot.forEach(doc => {
        usersMap[doc.id] = doc.data();
      });
      setAuthorUsers(usersMap);
    });

    const unsubRecipes = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      data.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setRecipes(data);
      setLoading(false);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });

    return () => {
      unsubCats();
      unsubRecipes();
      if (typeof unsubUsers === 'function') unsubUsers();
    };
  }, []);

  const handleStatusChange = async (recipe: Recipe, newStatus: string) => {
    try {
      const isPublished = newStatus === 'approved';
      await updateDoc(doc(db, 'recipes', recipe.id), {
        status: newStatus,
        isPublished: isPublished,
        updatedAt: new Date().toISOString()
      });
      toast.success('تم تحديث حالة الوصفة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
      toast.success('تم بنجاح');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const filteredRecipes = recipes.filter(r => 
    (r.title || "").includes(searchTerm) || 
     
    (categories[r.categoryId]?.name || '').includes(searchTerm)
  );

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">الوصفات</h1>
            <p className="text-slate-500 text-sm">Manage recipes</p>
          </div>
        </div>
        <Link to="/admin/recipes/new">
          <Button>
            <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />إضافة وصفة جديدة</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" id="search" name="search" aria-label="بحث" placeholder="ابحث عن وصفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">الوصفة</th>
                <th className="px-6 py-4 font-medium">التصنيفات</th>
                <th className="px-6 py-4 font-medium">صاحب الوصفة</th>
                <th className="px-6 py-4 font-medium">آخر تعديل</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد بيانات</td>
                </tr>
              ) : (
                filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={recipe.mainImage || 'https://images.unsplash.com/photo-1495195134817-a1a288965631?w=100&h=100&fit=crop'} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <p className="font-medium text-slate-900">{recipe.title}</p>
                          <p className="text-xs text-slate-500" dir="ltr">{recipe.titleFr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {categories[recipe.categoryId]?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {recipe.authorRole === 'admin' ? 'الإدارة' : recipe.authorId ? (authorUsers[recipe.authorId]?.displayName || 'مستخدم غير معروف') : 'الإدارة'}
                      <span className="block text-xs text-slate-500">{recipe.authorRole === 'admin' ? 'مدير' : 'مستخدم'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {recipe.updatedById ? (authorUsers[recipe.updatedById]?.displayName || (recipe.updatedByRole === 'admin' ? 'الإدارة' : 'مستخدم')) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {recipe.views || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
      <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        recipe.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
        recipe.status === 'approved' || (recipe.isPublished && !recipe.status) ? 'bg-green-100 text-green-700' :
        recipe.status === 'rejected' ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-600'
      }`}>
        {recipe.status === 'pending' ? 'قيد المراجعة' :
         recipe.status === 'approved' || (recipe.isPublished && !recipe.status) ? 'مقبولة' :
         recipe.status === 'rejected' ? 'مرفوضة' :
         'مسودة'}
      </span>
      {recipe.status === 'pending' && (
        <div className="flex gap-1 mt-1">
          <button onClick={() => handleStatusChange(recipe, 'approved')} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded">قبول</button>
          <button onClick={() => handleStatusChange(recipe, 'rejected')} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded">رفض</button>
        </div>
      )}
      {(recipe.status === 'approved' || recipe.status === 'rejected' || (recipe.isPublished && !recipe.status)) && (
        <select id={`status-${recipe.id}`} name="status" aria-label="حالة الوصفة" className="text-xs border-slate-200 rounded p-1" value={recipe.status || (recipe.isPublished ? 'approved' : 'draft')}
          onChange={(e) => handleStatusChange(recipe, e.target.value)}
        >
          <option value="approved">مقبولة (منشورة)</option>
          <option value="pending">قيد المراجعة</option>
          <option value="rejected">مرفوضة</option>
          <option value="draft">مسودة</option>
        </select>
      )}
    </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/recipes/edit/${recipe.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(recipe.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">تأكيد الحذف</div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>نعم، احذف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
