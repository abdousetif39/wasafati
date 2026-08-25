import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';

import { SEO } from '../../../components/seo/SEO';
import { MarkdownContent } from '../../../components/ui/MarkdownContent';
export default function InfoPage({ type }: { type: 'about' | 'privacy' | 'terms' | 'disclaimer' | 'cookies' }) {
  const { settings } = useSettingsStore();
  
  const contentMap = {
    about: { title: 'عن الموقع', content: settings?.about || '' },
    privacy: { title: 'سياسة الخصوصية', content: settings?.privacy || '' },
    terms: { title: 'شروط الاستخدام', content: settings?.terms || '' },
    disclaimer: { title: 'إخلاء المسؤولية', content: settings?.disclaimer || '' },
    cookies: { title: 'ملفات تعريف الارتباط', content: settings?.cookies || '' },
  };

  const { title, content } = contentMap[type];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <SEO title={title} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">{title}</h1>
          <div>{content ? <MarkdownContent content={content} /> : <p className='text-slate-500'>لا يوجد محتوى</p>}</div>
        </div>
      </div>
    </div>
  );
}
