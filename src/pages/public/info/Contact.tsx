import { useToast } from '../../../contexts/ToastContext';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';

export default function Contact() {
  const toast = useToast();
    const [loading, setLoading] = useState(false);
  const { settings } = useSettingsStore();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    const lastSent = localStorage.getItem('lastContactSent');
    if (lastSent && Date.now() - parseInt(lastSent) < 1000 * 60 * 60) {
      toast.error('يرجى الانتظار قبل الإرسال مرة أخرى');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
        subject: data.subject?.trim() || '',
        status: 'unread',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('lastContactSent', Date.now().toString());
      toast.success('تم الإرسال بنجاح');
      reset();
    } catch (error) {
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">تواصل معنا</h1>
          <p className="text-lg text-slate-600">تواصل معنا لأي استفسار</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">البريد الإلكتروني</h3>
              <p className="text-slate-600" dir="ltr">{settings?.email || 'contact@example.com'}</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">رقم الهاتف</h3>
              <p className="text-slate-600" dir="ltr">{settings?.phone || '+1 234 567 890'}</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="الاسم الكامل" 
                    {...register('name', { required: 'مطلوب' })} 
                    error={errors.name?.message as string}
                  />
                  <Input 
                    label={'البريد الإلكتروني' + ' *'} 
                    type="email" 
                    {...register('email', { required: 'مطلوب' })} 
                    error={errors.email?.message as string}
                    dir="ltr"
                  />
                </div>
                <Input 
                  label="الموضوع" 
                  {...register('subject', { required: 'مطلوب' })} 
                  error={errors.subject?.message as string}
                />
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">الرسالة</label>
                  <textarea id="message" name="message" 
                    {...register('message', { required: 'مطلوب' })}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.message ? 'border-red-500' : 'border-slate-300'}`}
                    rows={6}
                  />
                  {errors.message && <p className="mt-1.5 text-sm text-red-500">{errors.message.message as string}</p>}
                </div>
                <Button type="submit" isLoading={loading} className="w-full md:w-auto px-12 py-3 text-lg">إرسال</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
