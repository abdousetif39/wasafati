import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../contexts/ToastContext';
import React, { useEffect, useState } from 'react';
import { getDoc, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../../components/ui/Button';
import { Check, X, Eye } from 'lucide-react';
import { SEO } from '../../../components/seo/SEO';
import { Modal } from '../../../components/ui/Modal';
import { RecipeUpdate, Recipe, Ingredient, RecipeStep } from '../../../types';

export default function RecipeUpdateList() {
  const toast = useToast();
  const [updates, setUpdates] = useState<RecipeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<RecipeUpdate | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectMode, setRejectMode] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'recipeUpdates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecipeUpdate));
      setUpdates(fetched);
      setLoading(false);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
    return () => unsubscribe();
  }, []);

  
  const handleApprove = async () => {
    if (!selectedUpdate) return;
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('User not found');
      
      const recipeRef = doc(db, 'recipes', selectedUpdate.recipeId);
      const recipeDoc = await getDoc(recipeRef);
      if (!recipeDoc.exists()) {
        toast.error('الوصفة الأصلية غير موجودة');
        return;
      }
      const currentRecipe = recipeDoc.data();
      
      const oldSlug = currentRecipe.slug;
      const newSlug = selectedUpdate.proposedData.slug;
      let previousSlugs = currentRecipe.previousSlugs || [];
      if (oldSlug && newSlug && oldSlug !== newSlug && !previousSlugs.includes(oldSlug)) {
        previousSlugs = [...previousSlugs, oldSlug];
      }
      
      // Preserve author and createdBy fields
      const {
        authorId, authorRole, createdById, createdByRole,
        ...proposedUpdates
      } = selectedUpdate.proposedData;
      
      await updateDoc(recipeRef, { 
         ...proposedUpdates,
         slug: newSlug || oldSlug,
         previousSlugs,
         status: 'approved',
         isPublished: true,
         updatedAt: new Date().toISOString(),
         updatedById: currentUser.id,
         updatedByRole: currentUser.role || 'admin'
      });
      await updateDoc(doc(db, 'recipeUpdates', selectedUpdate.id!), { 
         status: 'approved',
         reviewedAt: new Date().toISOString(),
         reviewedBy: currentUser.id,
         reviewedByRole: currentUser.role || 'admin'
      });
      toast.success('تم قبول التعديل بنجاح');
      setSelectedUpdate(null);
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      toast.error('حدث خطأ أثناء القبول');
    }
  };

  
  const handleReject = async () => {
    if (!selectedUpdate) return;
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('User not found');
      
      await updateDoc(doc(db, 'recipeUpdates', selectedUpdate.id), { 
         status: 'rejected', 
         reviewNote: rejectNote, 
         updatedAt: new Date().toISOString(),
         reviewedAt: new Date().toISOString(),
         reviewedBy: currentUser.id,
         reviewedByRole: currentUser.role || 'admin'
      });
      toast.success('تم رفض التعديل');
      setSelectedUpdate(null);
      setRejectMode(false);
      setRejectNote('');
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      toast.error('حدث خطأ');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  const renderStringDiff = (oldStr: string | undefined, newStr: string | undefined) => {
    if (oldStr === newStr) return <span className="text-slate-400 text-sm">لم يتغير</span>;
    return (
      <div className="space-y-1 mt-1">
        <div className="text-red-500 line-through text-sm">{oldStr || 'لا يوجد'}</div>
        <div className="text-green-600 bg-green-50 px-2 py-1 rounded">{newStr || 'لا يوجد'}</div>
      </div>
    );
  };
  
  const getChangesSummary = (oldData: Partial<Recipe>, newData: Partial<Recipe>) => {
    const changes: string[] = [];
    if (oldData.title !== newData.title) changes.push('العنوان');
    if (oldData.slug !== newData.slug) changes.push('الرابط');
    if (oldData.description !== newData.description) changes.push('الوصف');
    if (oldData.shortDescription !== newData.shortDescription) changes.push('الوصف القصير');
    if (oldData.mainImage !== newData.mainImage) changes.push('الصورة الرئيسية');
    if (oldData.categoryId !== newData.categoryId) changes.push('التصنيف');
    if (oldData.prepTime !== newData.prepTime) changes.push('وقت التحضير');
    if (oldData.cookTime !== newData.cookTime) changes.push('وقت الطبخ');
    if (oldData.servings !== newData.servings) changes.push('الحصص');
    if (oldData.difficulty !== newData.difficulty) changes.push('الصعوبة');
    if (JSON.stringify(oldData.gallery) !== JSON.stringify(newData.gallery)) changes.push('معرض الصور');
    if (JSON.stringify(oldData.ingredients) !== JSON.stringify(newData.ingredients)) changes.push('المكونات');
    if (JSON.stringify(oldData.steps) !== JSON.stringify(newData.steps)) changes.push('الخطوات');
    
    return changes;
  };

  return (
    <div className="space-y-6">
      <SEO title="تعديلات الوصفات" noindex={true} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">تعديلات الوصفات</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4">اسم الوصفة</th>
                <th className="px-6 py-4">تاريخ الطلب</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {updates.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا توجد تعديلات معلقة</td></tr>
              ) : (
                updates.map(update => (
                  <tr key={update.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">{update.proposedData?.title || 'بدون اسم'}</td>
                    <td className="px-6 py-4">{new Date(update.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${update.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : update.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {update.status === 'pending' ? 'قيد المراجعة' : update.status === 'approved' ? 'مقبول' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUpdate(update)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                        <Eye className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" /> عرض التعديل
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedUpdate} onClose={() => { setSelectedUpdate(null); setRejectMode(false); }} title="مراجعة التعديل">
        {selectedUpdate && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pl-2">
            
            {/* Changes Summary */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
              {(() => {
                const changes = getChangesSummary(selectedUpdate.originalData, selectedUpdate.proposedData);
                if (changes.length === 0) return <strong>لا توجد تعديلات فعلية.</strong>;
                return (
                  <div>
                    <strong>تم تعديل {changes.length} عناصر:</strong>
                    <p className="text-sm mt-1">{changes.join('، ')}</p>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl relative">
              
              {/* Left Column: Old Data */}
              <div>
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">النسخة الحالية</h3>
                <div className="space-y-4">
                  <div><strong className="block text-xs text-slate-500 mb-1">العنوان:</strong>{selectedUpdate.originalData.title}</div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الرابط:</strong>{selectedUpdate.originalData.slug}</div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الوصف القصير:</strong>{selectedUpdate.originalData.shortDescription}</div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الوصف الكامل:</strong>{selectedUpdate.originalData.description}</div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الصورة الرئيسية:</strong>
                    {selectedUpdate.originalData.mainImage && <img src={selectedUpdate.originalData.mainImage} alt="Old" className="w-full max-w-[200px] h-auto rounded-lg mt-1" />}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">معلومات إضافية:</strong>
                    تحضير: {selectedUpdate.originalData.prepTime}د | طبخ: {selectedUpdate.originalData.cookTime}د | حصص: {selectedUpdate.originalData.servings} | صعوبة: {selectedUpdate.originalData.difficulty}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">التصنيف:</strong>
                    {selectedUpdate.originalData.categoryId}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">المكونات:</strong>
                    <ul className="list-disc list-inside text-sm mt-1 text-slate-700">
                      {selectedUpdate.originalData.ingredients?.map((ing, i) => (
                        <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الخطوات:</strong>
                    <ol className="list-decimal list-inside text-sm mt-1 text-slate-700">
                      {selectedUpdate.originalData.steps?.map((step, i) => (
                        <li key={i}>{step.title ? step.title + ': ' : ''}{step.description}</li>
                      ))}
                    </ol>
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">معرض الصور:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedUpdate.originalData.gallery?.map((img, i) => (
                        <img key={i} src={img} alt="old gallery" className="w-16 h-16 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: New Data & Diff */}
              <div className="border-r border-slate-200 pr-4">
                <h3 className="font-bold text-orange-600 mb-4 border-b pb-2">التعديل المقترح</h3>
                <div className="space-y-4">
                  <div>
                    <strong className="block text-xs text-slate-500 mb-1">العنوان:</strong>
                    {renderStringDiff(selectedUpdate.originalData.title, selectedUpdate.proposedData.title)}
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-500 mb-1">الرابط:</strong>
                    {renderStringDiff(selectedUpdate.originalData.slug, selectedUpdate.proposedData.slug)}
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-500 mb-1">الوصف القصير:</strong>
                    {renderStringDiff(selectedUpdate.originalData.shortDescription, selectedUpdate.proposedData.shortDescription)}
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-500 mb-1">الوصف الكامل:</strong>
                    {renderStringDiff(selectedUpdate.originalData.description, selectedUpdate.proposedData.description)}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الصورة الرئيسية:</strong>
                    {selectedUpdate.proposedData.mainImage === selectedUpdate.originalData.mainImage ? <span className="text-slate-400 text-sm">لم تتغير</span> : (
                      <div className="flex gap-2 items-center">
                        {selectedUpdate.originalData.mainImage && <img src={selectedUpdate.originalData.mainImage} alt="old" className="w-16 h-16 object-cover rounded opacity-50 line-through" />}
                        <span>↔</span>
                        {selectedUpdate.proposedData.mainImage && <img src={selectedUpdate.proposedData.mainImage} alt="new" className="w-32 h-auto object-cover rounded border-2 border-green-500" />}
                      </div>
                    )}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">معلومات إضافية:</strong>
                    {(() => {
                      const oldI = `تحضير: ${selectedUpdate.originalData.prepTime}د | طبخ: ${selectedUpdate.originalData.cookTime}د | حصص: ${selectedUpdate.originalData.servings} | صعوبة: ${selectedUpdate.originalData.difficulty}`;
                      const newI = `تحضير: ${selectedUpdate.proposedData.prepTime}د | طبخ: ${selectedUpdate.proposedData.cookTime}د | حصص: ${selectedUpdate.proposedData.servings} | صعوبة: ${selectedUpdate.proposedData.difficulty}`;
                      return renderStringDiff(oldI, newI);
                    })()}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">التصنيف:</strong>
                    {renderStringDiff(selectedUpdate.originalData.categoryId, selectedUpdate.proposedData.categoryId)}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">المكونات:</strong>
                    {JSON.stringify(selectedUpdate.proposedData.ingredients) === JSON.stringify(selectedUpdate.originalData.ingredients) ? <span className="text-slate-400 text-sm">لم تتغير</span> : (
                      <ul className="text-sm mt-1 space-y-1">
                        {/* Simple array diff visualization */}
                        {selectedUpdate.proposedData.ingredients?.map((ing, i) => {
                           const oldIng = selectedUpdate.originalData.ingredients?.find(o => o.name === ing.name);
                           if (!oldIng) return <li key={i} className="text-green-700 bg-green-50 p-1 rounded border border-green-200"><span className="text-xs bg-green-200 px-1 rounded ml-1">مضاف</span> {ing.quantity} {ing.unit} {ing.name}</li>;
                           if (oldIng.quantity !== ing.quantity || oldIng.unit !== ing.unit) return <li key={i} className="text-yellow-700 bg-yellow-50 p-1 rounded border border-yellow-200"><span className="text-xs bg-yellow-200 px-1 rounded ml-1">معدل</span> <span className="line-through opacity-50">{oldIng.quantity} {oldIng.unit}</span> {ing.quantity} {ing.unit} {ing.name}</li>;
                           return <li key={i} className="text-slate-500 p-1">لم يتغير: {ing.name}</li>;
                        })}
                        {selectedUpdate.originalData.ingredients?.filter(o => !selectedUpdate.proposedData.ingredients?.find(n => n.name === o.name)).map((o, i) => (
                           <li key={`del-${i}`} className="text-red-700 bg-red-50 p-1 rounded border border-red-200 line-through"><span className="text-xs bg-red-200 px-1 rounded ml-1 no-underline text-red-900">محذوف</span> {o.quantity} {o.unit} {o.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">الخطوات:</strong>
                    {JSON.stringify(selectedUpdate.proposedData.steps) === JSON.stringify(selectedUpdate.originalData.steps) ? <span className="text-slate-400 text-sm">لم تتغير</span> : (
                      <div className="text-sm mt-1 space-y-2">
                         {selectedUpdate.proposedData.steps?.map((step, i) => {
                             const oldStep = selectedUpdate.originalData.steps?.[i];
                             if (!oldStep) return <div key={i} className="text-green-700 bg-green-50 p-2 rounded border border-green-200"><span className="text-xs bg-green-200 px-1 rounded ml-1 block mb-1">خطوة جديدة</span> {step.title ? step.title + ': ' : ''}{step.description}</div>;
                             if (oldStep.description !== step.description || oldStep.title !== step.title) return <div key={i} className="text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200"><span className="text-xs bg-yellow-200 px-1 rounded ml-1 block mb-1">خطوة معدلة</span><div className="text-red-500 line-through mb-1">{oldStep.title ? oldStep.title + ': ' : ''}{oldStep.description}</div><div>{step.title ? step.title + ': ' : ''}{step.description}</div></div>;
                             return <div key={i} className="text-slate-500 p-1">الخطوة {i+1}: لم تتغير</div>;
                         })}
                         {selectedUpdate.originalData.steps?.slice(selectedUpdate.proposedData.steps?.length || 0).map((oldStep, i) => (
                             <div key={`del-${i}`} className="text-red-700 bg-red-50 p-2 rounded border border-red-200"><span className="text-xs bg-red-200 px-1 rounded ml-1 block mb-1">خطوة محذوفة</span><span className="line-through">{oldStep.title ? oldStep.title + ': ' : ''}{oldStep.description}</span></div>
                         ))}
                      </div>
                    )}
                  </div>
                  <div><strong className="block text-xs text-slate-500 mb-1">معرض الصور:</strong>
                    {JSON.stringify(selectedUpdate.proposedData.gallery) === JSON.stringify(selectedUpdate.originalData.gallery) ? <span className="text-slate-400 text-sm">لم يتغير</span> : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedUpdate.proposedData.gallery?.map((img, i) => {
                           const isNew = !selectedUpdate.originalData.gallery?.includes(img);
                           return (
                             <div key={i} className="relative">
                               <img src={img} alt="gallery" className={`w-16 h-16 object-cover rounded ${isNew ? 'border-2 border-green-500' : ''}`} />
                               {isNew && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1 rounded">صورة جديدة</span>}
                             </div>
                           )
                        })}
                        {selectedUpdate.originalData.gallery?.filter(img => !selectedUpdate.proposedData.gallery?.includes(img)).map((img, i) => (
                           <div key={`del-${i}`} className="relative opacity-50">
                               <img src={img} alt="gallery" className="w-16 h-16 object-cover rounded border-2 border-red-500" />
                               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1 rounded">محذوفة</span>
                               <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><X className="text-red-600" /></div>
                             </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedUpdate.status === 'pending' && (
              rejectMode ? (
                <div className="space-y-4 bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
                  <label htmlFor="rejectReason" className="block text-sm font-bold text-red-700">سبب الرفض:</label>
                  <textarea id="rejectReason" name="rejectReason" aria-label="سبب الرفض" value={rejectNote} 
                    onChange={e => setRejectNote(e.target.value)} 
                    className="w-full p-2 border border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white" 
                    rows={3} 
                    placeholder="يرجى كتابة سبب الرفض هنا..." 
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" onClick={() => setRejectMode(false)}>إلغاء</Button>
                    <Button variant="danger" onClick={handleReject}>تأكيد الرفض</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 sticky bottom-0 bg-white pb-2">
                  <Button variant="danger" onClick={() => setRejectMode(true)} className="px-6">رفض التعديل</Button>
                  <Button onClick={handleApprove} className="px-6">قبول التعديل</Button>
                </div>
              )
            )}
            
            {selectedUpdate.status !== 'pending' && (
              <div className="p-4 mt-4 bg-slate-50 rounded-xl text-center border border-slate-200">
                هذا التعديل تمت مراجعته مسبقاً وحالته: <strong>{selectedUpdate.status === 'approved' ? 'مقبول' : 'مرفوض'}</strong>
                {selectedUpdate.reviewNote && (
                  <p className="mt-2 text-red-600 text-sm">ملاحظة الرفض: {selectedUpdate.reviewNote}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
