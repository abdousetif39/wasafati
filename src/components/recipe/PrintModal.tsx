import { optimizeCloudinaryUrl } from '../../lib/cloudinary';
import React from 'react';
import { Recipe } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  authorName?: string;
  wilaya?: string;
  municipality?: string;
}

export function PrintModal({ isOpen, onClose, recipe, authorName, wilaya, municipality }: PrintModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const difficultyMap = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="طباعة الوصفة" className="print-hidden">
      <div className="space-y-6">
        <p className="text-slate-600 text-sm text-center">
          ستظهر النسخة المطبوعة منسقة بشكل مختلف لإخفاء العناصر غير الضرورية (مثل الأزرار والقوائم) وتوفير الحبر.
        </p>

        {/* Print Preview - simplified for modal display, not the actual print layout */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-[50vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
            {authorName && <p className="text-sm text-slate-500">من إعداد: {authorName}</p>}
          </div>
          
          {recipe.mainImage && (
             <div className="flex justify-center mb-6">
                <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-48 h-48 object-cover rounded-lg" />
             </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div className="text-center p-2 bg-white rounded border">
              <span className="block text-slate-500">التحضير</span>
              <span className="font-bold">{recipe.prepTime} دقيقة</span>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <span className="block text-slate-500">الطبخ</span>
              <span className="font-bold">{recipe.cookTime} دقيقة</span>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <span className="block text-slate-500">الحصص</span>
              <span className="font-bold">{recipe.servings}</span>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <span className="block text-slate-500">الصعوبة</span>
              <span className="font-bold">{difficultyMap[recipe.difficulty]}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2 border-b pb-2">المكونات</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2 border-b pb-2">طريقة التحضير</h3>
            <ol className="list-decimal list-inside text-sm space-y-2">
              {recipe.steps.map((step, i) => (
                <li key={i}>{step.title ? step.title + ': ' : ''}{step.description}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} type="button">إلغاء</Button>
          <Button onClick={handlePrint} type="button">متابعة للطباعة</Button>
        </div>
      </div>
    </Modal>
  );
}
