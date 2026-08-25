#!/bin/bash
cat << 'INNER_EOF' >> src/pages/public/recipes/UserRecipeForm.tsx
      const cleanData = { ...data };
      if (!cleanData.slug) {
        cleanData.slug = await generateUniqueSlug(cleanData.title || '', 'recipes', undefined, user.id);
      }
      
      cleanData.totalTime = Number(cleanData.prepTime || 0) + Number(cleanData.cookTime || 0);
      
      if (isEditing && id) {
        cleanData.updatedAt = new Date().toISOString();
        cleanData.updatedById = user.id;
        cleanData.updatedByRole = user.role || 'user';
        // force pending on user edit
        cleanData.status = 'pending';
        await updateDoc(doc(db, 'recipes', id), cleanData);
        toast.success('تم تحديث الوصفة بنجاح، وهي قيد المراجعة الآن!');
      } else {
        cleanData.createdAt = new Date().toISOString();
        cleanData.authorId = user.id;
        cleanData.authorRole = user.role || 'user';
        cleanData.createdById = user.id;
        cleanData.createdByRole = user.role || 'user';
        cleanData.status = 'pending';
        await addDoc(collection(db, 'recipes'), cleanData);
        toast.success('تم إرسال الوصفة للمراجعة بنجاح!');
      }
      navigate('/profile');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ الوصفة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'تعديل الوصفة' : 'إضافة وصفة جديدة'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={'الاسم' + ' *'} {...register('title', { required: true })} />
            
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">{'التصنيفات' + ' *'}</label>
              <select id="categoryId" {...register('categoryId', { required: true })} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500">
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
            
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-700">وصف قصير</label>
              <textarea id="shortDescription" {...register('shortDescription')} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500" rows={2} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">الوقت والتفاصيل</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="وقت التحضير (دقيقة)" type="number" {...register('prepTime')} />
            <Input label="وقت الطبخ (دقيقة)" type="number" {...register('cookTime')} />
            <Input label="الحصص" type="number" {...register('servings')} />
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1.5">الصعوبة</label>
              <select id="difficulty" {...register('difficulty')} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500">
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">المكونات</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => appendIng({ name: '', quantity: '', unit: '' })}>
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />إضافة
            </Button>
          </div>
          {ingFields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-3 items-start border-b border-slate-50 pb-4">
              <Input placeholder='الكمية (مثال 500)' {...register(`ingredients.${index}.quantity` as const)} className="w-full sm:w-24 flex-shrink-0" />
              <Input placeholder='الوحدة (غ، ملعقة...)' {...register(`ingredients.${index}.unit` as const)} className="w-full sm:w-32 flex-shrink-0" />
              <Input placeholder='اسم المكون' {...register(`ingredients.${index}.name` as const, { required: true })} className="w-full" />
              <button type="button" onClick={() => removeIng(index)} className="p-2.5 mt-1 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">الخطوات</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => appendStep({ stepNumber: stepFields.length + 1, title: '', description: '' })}>
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />إضافة
            </Button>
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
INNER_EOF
