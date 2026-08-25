import { useToast } from '../../../contexts/ToastContext';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { generateUniqueSlug } from '../../../lib/slug';
import { db } from '../../../config/firebase';
import { Category } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ImageUpload } from '../../../components/ui/ImageUpload';

interface CategoryFormProps {
  initialData?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({
  initialData, onSuccess, onCancel }: CategoryFormProps) {
  const toast = useToast();
    const [loading, setLoading] = useState(false);
  
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      imageUrl: initialData?.imageUrl || '',
      isActive: initialData?.isActive ?? true,
    }
  });

  
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!initialData?.slug) {
        data.slug = await generateUniqueSlug(data.name || '', 'categories');
      } else if (data.name !== initialData.name) {
        // Name changed, update slug
        data.slug = await generateUniqueSlug(data.name || '', 'categories', initialData.id);
        
        // Ensure previousSlugs array exists
        const oldSlugs = initialData.previousSlugs || [];
        if (initialData.slug && !oldSlugs.includes(initialData.slug) && data.slug !== initialData.slug) {
           data.previousSlugs = [...oldSlugs, initialData.slug];
        }
      }

      if (initialData) {
        await updateDoc(doc(db, 'categories', initialData.id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
        toast.success('تم بنجاح');
      } else {
        await addDoc(collection(db, 'categories'), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success('تم بنجاح');
      }
      onSuccess();
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input
          label={'الاسم' + ' *'}
          {...register('name', { required: 'مطلوب' })}
          error={errors.name?.message as string}
        />
        
      </div>

      

      <div>
        <Controller
          control={control}
          name="imageUrl"
          render={({ field: { value, onChange } }) => (
            <ImageUpload
              label="صورة التصنيف (اختياري)"
              value={value}
              onChange={onChange}
              folder="categories"
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">الوصف</label>
        <textarea id="description" {...register('description')}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={3}
        />
      </div>

      

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">تصنيف مفعّل</label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading}>حفظ</Button>
      </div>
    </form>
  );
}
