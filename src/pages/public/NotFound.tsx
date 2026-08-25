import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-6">
        <ChefHat className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-8 text-center max-w-md">
        الصفحة التي تبحث عنها غير موجودة. قد يكون تم نقلها أو حذفها.
      </p>
      <Link to="/">
        <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl">
          العودة إلى الرئيسية
        </Button>
      </Link>
    </div>
  );
}
