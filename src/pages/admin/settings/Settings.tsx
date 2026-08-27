import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Settings as SettingsType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { Controller, useWatch } from 'react-hook-form';
import { MarkdownContent } from '../../../components/ui/MarkdownContent';
import { SettingsIcon } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';

export default function Settings() {
  const toast = useToast();
    const [loading, setLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const { fetchSettings } = useSettingsStore();

  const { register, control, handleSubmit, reset } = useForm<SettingsType>({
    defaultValues: {
      siteName: '', logoUrl: '', description: '', email: '', phone: '',
      facebookUrl: '', twitterUrl: '', instagramUrl: '',
      about: '', privacy: '', terms: '', cookies: '', disclaimer: ''
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        reset(docSnap.data() as SettingsType);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsType) => {
    const normalizedPhone = data.phone?.trim() || '';
    if (normalizedPhone !== '' && !/^\d{10}$/.test(normalizedPhone)) {
      setIsPhoneModalOpen(true);
      return;
    }
    
    setLoading(true);
    try {
      data.phone = normalizedPhone;
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, 'settings', 'global'), cleanData);
      await fetchSettings();
      toast.success('تم بنجاح');
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-slate-500 text-sm">Customize site info and legal pages</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label='Site Name *' {...register('siteName', { required: true })} />
            <div className="space-y-2">
              <Controller
                control={control}
                name="logoUrl"
                render={({ field: { value, onChange } }) => (
                  <ImageUpload
                    label='شعار الموقع'
                    value={value}
                    onChange={onChange}
                    folder="settings"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="heroImage"
                render={({ field: { value, onChange } }) => (
                  <ImageUpload
                    label='صورة الغلاف'
                    value={value}
                    onChange={onChange}
                    folder="settings"
                  />
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">وصف الموقع (SEO)</label>
              <textarea id="description" {...register('description')} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl" rows={3} />
            </div>
            <Input label='Contact Email' type="email" {...register('email')} dir="ltr" />
            <Input label='Phone Number' {...register('phone')} dir="ltr" />
            <Input label='Facebook URL' {...register('facebookUrl')} dir="ltr" />
            <Input label='Instagram URL' {...register('instagramUrl')} dir="ltr" />
          </div>
        </div>

        
        {/* Legal Pages */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">محتوى الصفحات القانونية والمعلومات (يدعم Markdown)</h2>
          
          <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4">
            <p className="font-bold mb-2">يمكنك استخدام تنسيق Markdown مثل:</p>
            <ul className="list-disc list-inside space-y-1" dir="ltr" style={{textAlign: 'right'}}>
              <li># عنوان رئيسي</li>
              <li>## عنوان فرعي</li>
              <li>- قائمة</li>
              <li>**نص عريض**</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 gap-12">
            {[
              { id: 'about', label: 'عن الموقع' },
              { id: 'privacy', label: 'سياسة الخصوصية' },
              { id: 'terms', label: 'شروط الاستخدام' },
              { id: 'cookies', label: 'سياسة ملفات تعريف الارتباط' },
              { id: 'disclaimer', label: 'إخلاء المسؤولية' }
            ].map(page => (
              <div key={page.id} className="space-y-4">
                <label htmlFor={page.id} className="block text-lg font-bold text-slate-800">{page.label}</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor={page.id} className="sr-only">المحرر</label>
                    <span aria-hidden="true" className="text-xs font-semibold text-slate-500 uppercase">المحرر</span>
                    <textarea id={page.id} 
                      {...register(page.id as keyof SettingsType)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm h-64 focus:bg-white transition-colors" 
                      placeholder="أدخل النص هنا..."
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">المعاينة</span>
                    <div className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl h-64 overflow-y-auto">
                      <Controller
                        control={control}
                        name={page.id as keyof SettingsType}
                        render={({ field: { value } }) => (
                          value ? <MarkdownContent content={value as string} className="!text-sm" /> : <p className="text-slate-500 text-sm">المعاينة ستظهر هنا...</p>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AdSense Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-4">Google AdSense Ads Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-4">
              <div className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="adsEnabled" {...register('adsEnabled')} className="w-5 h-5 text-orange-600 rounded border-slate-300" />
                <label htmlFor="adsEnabled" className="font-bold text-slate-700 cursor-pointer">Enable ads on the site</label>
              </div>
            </div>
            
            <Input label='Publisher ID *' placeholder="ca-pub-XXXXXXXXXXXXXXXX" {...register('adsPublisherId')} dir="ltr" className="md:col-span-2" />
            <Input label='Ad Slot (Home)' {...register('adsSlotHome')} dir="ltr" />
            <Input label='Ad Slot (Recipe List)' {...register('adsSlotRecipeList')} dir="ltr" />
            <Input label='Ad Slot (Inside Recipe)' {...register('adsSlotRecipe')} dir="ltr" />
            <Input label='Ad Slot (Sidebar)' {...register('adsSlotSidebar')} dir="ltr" />
          </div>
        </div>

        <div className="flex justify-end gap-4 sticky bottom-6 z-10">
          <Button type="submit" isLoading={loading} className="px-10 shadow-lg">حفظ</Button>
        </div>
      </form>
      
      <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title="رقم هاتف غير صالح">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <p className="text-slate-600 mb-6 font-medium">
            يجب أن يحتوي رقم الهاتف على 10 أرقام بالضبط.
          </p>
          <Button onClick={() => setIsPhoneModalOpen(false)} className="w-full" type="button">
            حسنًا
          </Button>
        </div>
      </Modal>
    </div>
  );
}
