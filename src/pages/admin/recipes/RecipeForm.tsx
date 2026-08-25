import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { generateUniqueSlug } from '../../../lib/slug';
import { db } from '../../../config/firebase';
import { Recipe, Category, Ingredient, RecipeStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export default function RecipeForm() {
  const toast = useToast();
    const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = Boolean(id);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<Partial<Recipe>>({
    defaultValues: {
      title: '',  slug: '', shortDescription: '', 
      description: '',  mainImage: '', gallery: [], categoryId: '',
      tags: [], prepTime: 15, cookTime: 30, servings: 4, difficulty: 'medium',
      ingredients: [{ name: '',  quantity: '', unit: '' }],
      steps: [{ stepNumber: 1, title: '',  description: ''}],
      isPublished: true, isFeatured: false
    }
  });

  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' });
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' });

  useEffect(() => {
    const fetchCatsAndData = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));

      if (isEditing && id) {
        const docSnap = await getDoc(doc(db, 'recipes', id));
        if (docSnap.exists()) {
          reset(docSnap.data());
        } else {
          toast.error('الوصفة غير موجودة');
          navigate('/admin/recipes');
        }
      }
    };
    fetchCatsAndData();
  }, [id, isEditing, reset, navigate]);

  const generateSlug = (text: string) => {
    return text.trim().replace(/\s+/g, '-').replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('User not found');
      
      data.totalTime = Number(data.prepTime || 0) + Number(data.cookTime || 0);
      data.updatedAt = new Date().toISOString();
      data.updatedById = currentUser.id;
      data.updatedByRole = currentUser.role || 'admin';
      
      // Ensure steps are ordered
      data.steps = data.steps.map((s: any, i: number) => ({ ...s, stepNumber: i + 1 }));
      
      const cleanData = JSON.parse(JSON.stringify(data));
      
      if (isEditing && id) {
        // Fetch current recipe to preserve authorId and previousSlugs
        const currentDoc = await getDoc(doc(db, 'recipes', id));
        const currentData = currentDoc.data();
        
        let newSlug = currentData.slug;
        let prevSlugs = currentData.previousSlugs || [];
        
        if (cleanData.title && cleanData.title !== currentData.title) {
          newSlug = await generateUniqueSlug(cleanData.title, 'recipes', id);
          if (newSlug !== currentData.slug) {
            if (!prevSlugs.includes(currentData.slug)) {
              prevSlugs.push(currentData.slug);
            }
          }
        }
        
        await updateDoc(doc(db, 'recipes', id), {
          ...cleanData,
          slug: newSlug,
          previousSlugs: prevSlugs,
          status: cleanData.isPublished ? 'approved' : currentData.status
        });
        toast.success('تم التعديل بنجاح');
      } else {
        const slug = await generateUniqueSlug(cleanData.title || '', 'recipes');
        const newRecipe = {
          ...cleanData,
          slug,
          previousSlugs: [],
          authorId: currentUser.id,
          authorRole: currentUser.role || 'admin',
          createdById: currentUser.id,
          createdByRole: currentUser.role || 'admin',
          status: cleanData.isPublished ? 'approved' : 'pending',
          views: 0,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'recipes'), newRecipe);
        toast.success('تمت الإضافة بنجاح');
      }
      navigate('/admin/recipes');
    } catch (error) {

      if ((error as any)?.code !== 'permission-denied') { console.error(error); }
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowRight className="w-6 h-6 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'تعديل' : 'إضافة وصفة جديدة'}</h1>
          <p className="text-slate-500 text-sm">أدخل التفاصيل لبناء صفحة وصفة متكاملة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={'الاسم' + ' *'} {...register('title', { required: true })} />
            
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">{'التصنيفات' + ' *'}</label>
              <select id="categoryId" {...register('categoryId', { required: true })} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl">
                <option value="">التصنيفات</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="mainImage"
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <ImageUpload
                    label="الصورة الرئيسية *"
                    value={value}
                    onChange={onChange}
                    folder="recipes"
                  />
                )}
              />
            </div>
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="gallery"
                render={({ field: { value, onChange } }) => (
                  <ImageUpload
                    label='معرض الصور (اختياري)'
                    value={value || []}
                    onChange={onChange}
                    multiple
                    folder="recipes/gallery"
                  />
                )}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-700">وصف قصير</label>
              <textarea id="shortDescription" {...register('shortDescription')} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl" rows={2} />
            </div>
          </div>
        </div>

        {/* Details & Times */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">الوقت والتفاصيل</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="وقت التحضير" type="number" {...register('prepTime')} />
            <Input label="وقت الطبخ" type="number" {...register('cookTime')} />
            <Input label="الحصص" type="number" {...register('servings')} />
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1.5">الصعوبة</label>
              <select id="difficulty" {...register('difficulty')} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl">
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">المكونات</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => appendIng({ name: '', quantity: '', unit: '' })}>
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />إضافة</Button>
          </div>
          {ingFields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-3 items-start border-b border-slate-50 pb-4">
              <Input placeholder='الكمية (مثال 500)' {...register(`ingredients.${index}.quantity` as const)} className="w-full sm:w-24 flex-shrink-0" />
              <Input placeholder='الوحدة (غ، ملعقة...)' {...register(`ingredients.${index}.unit` as const)} className="w-full sm:w-32 flex-shrink-0" />
              <Input placeholder='اسم المكون' {...register(`ingredients.${index}.name` as const)} className="w-full" />
              <button type="button" onClick={() => removeIng(index)} className="p-2.5 mt-1 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">الخطوات</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => appendStep({ stepNumber: stepFields.length + 1, title: '', description: '' })}>
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />إضافة</Button>
          </div>
          {stepFields.map((field, index) => (
            <div key={field.id} className="p-4 bg-slate-50 rounded-xl space-y-4 relative">
              <div className="absolute top-4 left-4">
                <button type="button" onClick={() => removeStep(index)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-bold text-slate-700">الخطوة {index + 1}</h3>
              <div className="grid grid-cols-1 gap-4">
                <Input placeholder='عنوان الخطوة (اختياري)' {...register(`steps.${index}.title` as const)} />
                <textarea id={`step-${index}-desc`} aria-label="تفاصيل الخطوة" placeholder='تفاصيل الخطوة *' {...register(`steps.${index}.description` as const, { required: true })} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" rows={3} />
                
                <Controller
                  control={control}
                  name={`steps.${index}.imageUrl` as const}
                  render={({ field: { value, onChange } }) => (
                    <ImageUpload
                      label='صورة الخطوة (اختياري)'
                      value={value}
                      onChange={onChange}
                      folder="recipes/steps"
                      className="mt-2"
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Publishing & Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">إعدادات النشر</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="isPublished" {...register('isPublished')} className="w-5 h-5 text-orange-600 rounded border-slate-300" />
              <label htmlFor="isPublished" className="font-medium text-slate-700 cursor-pointer">نشر الوصفة (مرئية للزوار)</label>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="isFeatured" {...register('isFeatured')} className="w-5 h-5 text-orange-600 rounded border-slate-300" />
                <label htmlFor="isFeatured" className="font-medium text-slate-700 cursor-pointer">وصفة مميزة</label>
              </div>
          </div>
        </div>

        

        <div className="flex justify-end gap-4 sticky bottom-6 z-10">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>إلغاء</Button>
          <Button type="submit" isLoading={loading} className="px-10">حفظ</Button>
        </div>
      </form>
    </div>
  );
}
