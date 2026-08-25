import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-300 p-4 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm leading-relaxed">
          'نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك
          'باستخدامك للموقع أنت توافق على <Link to="/cookies" className="text-orange-400 hover:underline">ملفات تعريف الارتباط</Link>  'و  <Link to="/privacy" className="text-orange-400 hover:underline">سياسة الخصوصية</Link>  'الخاصة بنا 
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleAccept} className="w-full sm:w-auto whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white">تأكيد</Button>
          <button onClick={() => setIsVisible(false)} className="p-2 text-slate-400 hover:text-white transition-colors" aria-label="إلغاء">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
