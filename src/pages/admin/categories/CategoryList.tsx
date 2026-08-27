import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Category } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Plus, Edit2, Trash2, Tag as TagIcon, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CategoryForm } from './CategoryForm';

export default function CategoryList() {
  const toast = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      data.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      data.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setCategories(data);
      setLoading(false);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
    return () => unsubscribe();
  }, []);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await updateDoc(doc(db, 'categories', category.id), {
        isActive: !category.isActive,
        updatedAt: new Date().toISOString()
      });
      toast.success('تم بنجاح');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('تم بنجاح');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <TagIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">التصنيفات</h1>
            <p className="text-slate-500 text-sm">إدارة التصنيفات</p>
          </div>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />إضافة</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">الاسم</th>
                                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد بيانات</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <TagIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{category.name}</td>
                                        <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          category.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {category.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {category.isActive ? 'نعم' : 'لا'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(category.id)}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'تعديل' : 'التصنيفات'}
      >
        <CategoryForm 
          initialData={editingCategory} 
          onSuccess={() => setIsModalOpen(false)} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">تأكيد الحذف<br />
            تحذير: الوصفات المرتبطة بهذا التصنيف قد تفقد تصنيفها. من الأفضل إيقاف تفعيل التصنيف بدلاً من حذفه.
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>نعم، احذف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
