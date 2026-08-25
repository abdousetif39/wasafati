import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { generateUniqueSlug } from '../../../lib/slug';
import { db } from '../../../config/firebase';
import { Recipe, Category, Ingredient, RecipeStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export default function UserRecipeForm() {
  const toast = useToast();
  const { user } = useAuthStore();
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
      status: 'pending', isPublished: false, isFeatured: false, authorId: ''
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

  
    const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }
      
      data.totalTime = Number(data.prepTime || 0) + Number(data.cookTime || 0);
      data.updatedAt = new Date().toISOString();
      data.updatedById = user.id;
      data.updatedByRole = user.role || 'user';
      
      // Ensure steps are ordered
      data.steps = data.steps.map((s: any, i: number) => ({ ...s, stepNumber: i + 1 }));
      const cleanData = JSON.parse(JSON.stringify(data));
      
      if (isEditing && id) {
        // Find if an existing update is pending
        const q = query(collection(db, 'recipeUpdates'), where('recipeId', '==', id), where('status', '==', 'pending'));
        const existingUpdate = await getDocs(q);
        
        if (!existingUpdate.empty) {
          await updateDoc(doc(db, 'recipeUpdates', existingUpdate.docs[0].id), {
            proposedData: cleanData,
            updatedAt: new Date().toISOString()
          });
        } else {
          const originalRecipe = await getDoc(doc(db, 'recipes', id));
          let originalData = originalRecipe.data();
          // We shouldn't change the original title/slug in the update directly without admin approval, so cleanData maintains it.
          
          await addDoc(collection(db, 'recipeUpdates'), {
            recipeId: id,
            authorId: user.id,
            authorRole: user.role || 'user',
            originalData,
            proposedData: cleanData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        toast.success('تم إرسال التعديلات للمراجعة');
      } else {
        const slug = await generateUniqueSlug(cleanData.title || '', 'recipes', undefined, user.id);
        cleanData.slug = slug;
        cleanData.previousSlugs = [];
        cleanData.authorId = user.id;
        cleanData.authorRole = user.role || 'user';
        cleanData.createdById = user.id;
        cleanData.createdByRole = user.role || 'user';
        cleanData.createdAt = new Date().toISOString();
        cleanData.views = 0;
        cleanData.status = 'pending';
        cleanData.isPublished = false;
        
        await addDoc(collection(db, 'recipes'), cleanData);
        toast.success('تم إضافة الوصفة وإرسالها للمراجعة');
      }
      navigate('/profile');
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
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'تعديل وصفتي' : 'إضافة وصفة جديدة'}</h1>
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

        <div className="flex justify-end gap-4 sticky bottom-6 z-10">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>إلغاء</Button>
          <Button type="submit" isLoading={loading} className="px-10">إرسال للمراجعة</Button>
        </div>
      </form>
    </div>
  );
}
