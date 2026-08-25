import { Modal } from '../../components/ui/Modal';
import UserChat from './chat/UserChat';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { optimizeCloudinaryUrl } from '../../lib/cloudinary';
import { SEO } from '../../components/seo/SEO';
import { useToast } from '../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Heart, Utensils, Settings, LogOut, Edit2, Clock, Users, Camera, Shield, User, MapPin, Plus , MessageSquare } from 'lucide-react';
import { RecipeLink } from '../../components/recipe/RecipeLink';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Recipe } from '../../types';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { algerianWilayas, getMunicipalities } from '../../lib/algeriaLocations';

export default function Profile() {
  const toast = useToast();
  const { getCategorySlug } = useCategoriesStore();
  const { user, isAdmin, logout, firebaseUser, setUser, loading, isInitialized } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'info' | 'favorites' | 'my-recipes' | 'messages'>((location.state as any)?.activeTab || 'info');
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingMyRecipes, setLoadingMyRecipes] = useState(false);

  const [name, setName] = useState(user?.displayName || '');
  const [wilaya, setWilaya] = useState(user?.wilaya || '');
  const [municipality, setMunicipality] = useState(user?.municipality || '');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [showPhone, setShowPhone] = useState(user?.showPhone || false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [photo, setPhoto] = useState(user?.photoURL || '');

  useEffect(() => {
    const tabFromState = (location.state as any)?.activeTab;
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'messages' || tabFromUrl === 'info' || tabFromUrl === 'favorites' || tabFromUrl === 'my-recipes') {
       setActiveTab(tabFromUrl);
    } else if (tabFromState) {
       setActiveTab(tabFromState);
    }
  }, [location.state, searchParams]);
  

  useEffect(() => {
    if (activeTab === 'favorites' && user?.id && favorites.length === 0) {
      fetchFavorites();
    }
    if (activeTab === 'my-recipes' && user?.id && myRecipes.length === 0) {
      fetchMyRecipes();
    }
  }, [activeTab, user?.id]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-slate-500 font-medium">جارٍ التحقق من جلسة المستخدم...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fetchFavorites = async () => {
    if (!user?.id) return;
    setLoadingFavorites(true);
    try {
      const favQ = query(collection(db, 'favorites'), where('userId', '==', user.id));
      const favSnap = await getDocs(favQ);
      
      if (!favSnap.empty) {
        const recipeIds = favSnap.docs.map(d => d.data().recipeId);
        
        const recipesList: Recipe[] = [];
        for (let i = 0; i < recipeIds.length; i += 10) {
          const chunk = recipeIds.slice(i, i + 10);
          const recQ = query(collection(db, 'recipes'), where('__name__', 'in', chunk), where('isPublished', '==', true));
          const recSnap = await getDocs(recQ);
          recipesList.push(...recSnap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
        }
        setFavorites(recipesList);
      }
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error(error); }
    } finally {
      setLoadingFavorites(false);
    }
  };

  const fetchMyRecipes = async () => {
    if (!user?.id) return;
    setLoadingMyRecipes(true);
    try {
      const q = query(collection(db, 'recipes'), where('authorId', '==', user.id));
      const snap = await getDocs(q);
      setMyRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error(error); }
    } finally {
      setLoadingMyRecipes(false);
    }
  };

  const handlePhotoChange = async (url: string) => {
    setPhoto(url);
    if (user && user.id) {
      try {
        await updateDoc(doc(db, 'users', user.id), { photoURL: url });
      await setDoc(doc(db, 'publicProfiles', user.id), { photoURL: url }, { merge: true });
        setUser({ ...user, photoURL: url }, firebaseUser);
      } catch (e) {
        if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      }
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;
    
    const normalizedPhone = phone.trim();
    if (normalizedPhone !== '' && !/^\d{10}$/.test(normalizedPhone)) {
      setPhoneError(true);
      setIsPhoneModalOpen(true);
      return;
    }

    setSavingProfile(true);
    try {
      const updates = {
        displayName: name,
        wilaya,
        municipality,
        address,
        phone,
        showPhone,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'users', user.id), updates);
      const publicData: any = { 
        displayName: updates.displayName,
        wilaya: updates.wilaya,
        municipality: updates.municipality
      };
      if (updates.showPhone && updates.phone) {
        publicData.phone = updates.phone;
      } else {
        publicData.phone = deleteField();
      }
      await setDoc(doc(db, 'publicProfiles', user.id), publicData, { merge: true });
      setUser({ ...user, ...updates }, firebaseUser);
      toast.success('تم تحديث معلوماتك بنجاح');
    } catch(e) {
      if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Navigate is handled by the component re-rendering with user=null, 
    // which triggers the <Navigate to="/login" /> we added earlier.
  };

  

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEO title="حسابي" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <div className="flex justify-center mb-6">
                <ImageUpload 
                  value={photo} 
                  onChange={handlePhotoChange} 
                  isAvatar={true} 
                  folder="avatars"
                />
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-1">{user.displayName || 'المستخدم'}</h2>
                <p className="text-sm text-slate-500" dir="ltr">{user.email}</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">الاسم</p>
                    <p className="font-semibold text-slate-800 text-sm">{user.displayName || 'المستخدم'}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">الدور</p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {isAdmin ? 'مسؤول' : 'مستخدم'}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />تسجيل الخروج</button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 min-h-[400px]">
              
              <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-100 mb-6 overflow-x-auto whitespace-nowrap">
                <button 
                  className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'info' ? 'text-orange-600 border-orange-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  onClick={() => setActiveTab('info')}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"><User className="w-5 h-5" /> معلوماتي</div>
                </button>
                <button 
                  className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'favorites' ? 'text-orange-600 border-orange-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  onClick={() => setActiveTab('favorites')}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"><Heart className="w-5 h-5" /> المفضلة</div>
                </button>
                <button 
                  className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'my-recipes' ? 'text-orange-600 border-orange-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  onClick={() => setActiveTab('my-recipes')}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"><Utensils className="w-5 h-5" /> وصفاتي</div>
                </button>
                <button 
                  className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'messages' ? 'text-orange-600 border-orange-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  onClick={() => setActiveTab('messages')}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"><MessageSquare className="w-5 h-5" /> الرسائل</div>
                </button>
              </div>

              {activeTab === 'info' && (
                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                  <Input label="الاسم" value={name} onChange={e => setName(e.target.value)} required />
                  <Select 
                    label="الولاية" 
                    value={wilaya} 
                    onChange={e => {
                      setWilaya(e.target.value);
                      setMunicipality('');
                    }}
                    options={[{ value: '', label: 'اختر الولاية' }, ...algerianWilayas.map(w => ({ value: w.name, label: w.name }))]}
                  />
                  <Select 
                    label="البلدية" 
                    value={municipality} 
                    onChange={e => setMunicipality(e.target.value)}
                    options={[{ value: '', label: 'اختر البلدية' }, ...(wilaya ? getMunicipalities(wilaya).map(m => ({ value: m, label: m })) : [])]}
                    disabled={!wilaya}
                  />
                  <Input label="العنوان (اختياري)" value={address} onChange={e => setAddress(e.target.value)} placeholder="حي 500 مسكن، شارع..." />
                  <Input label="رقم الهاتف (اختياري)" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" dir="ltr" className="text-left" />
                  <div className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="showPhone" name="showPhone" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4" />
                    <label htmlFor="showPhone" className="text-slate-700 cursor-pointer">إظهار رقم الهاتف للزوار</label>
                  </div>
                  <Button type="submit" isLoading={savingProfile} disabled={savingProfile}>
                    حفظ التغييرات
                  </Button>
                </form>
              )}

              {activeTab === 'favorites' && (
                <>
                {loadingFavorites ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                  </div>
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map(recipe => (
                      <RecipeLink key={recipe.id} recipe={recipe} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col">
                        <div className="relative h-40 overflow-hidden bg-slate-100">
                          <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="text-base font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">{recipe.title}</h4>
                          <p className="text-slate-500 text-xs mb-3 line-clamp-2 flex-1">
                            {recipe.shortDescription}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.totalTime} دقيقة</div>
                            <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {recipe.servings}</div>
                          </div>
                        </div>
                      </RecipeLink>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                    <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">لا توجد وصفات</p>
                    <Link to="/recipes" className="inline-block mt-4 text-orange-600 font-medium hover:text-orange-700">استكشف الوصفات</Link>
                  </div>
                )}
                </>
              )}
              
              {activeTab === 'my-recipes' && (
                 <>
                   <div className="flex justify-end mb-4">
                      <Link to="/profile/recipes/new" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                         <Plus className="w-4 h-4" /> إضافة وصفة جديدة
                      </Link>
                   </div>
                   {loadingMyRecipes ? (
                     <div className="flex justify-center items-center py-20">
                       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                     </div>
                   ) : myRecipes.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {myRecipes.map(recipe => (
                         <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative">
                           <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                             <span className={`text-xs font-bold px-2 py-1 rounded ${recipe.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : recipe.status === 'approved' || (recipe.isPublished && !recipe.status) ? 'bg-green-100 text-green-700' : recipe.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                               {recipe.status === 'pending' ? 'قيد المراجعة' : recipe.status === 'approved' || (recipe.isPublished && !recipe.status) ? 'منشورة' : recipe.status === 'rejected' ? 'مرفوضة' : 'مسودة'}
                             </span>
                           </div>
                           <RecipeLink recipe={recipe} className="relative h-40 overflow-hidden bg-slate-100">
                             <img src={optimizeCloudinaryUrl(recipe.mainImage)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           </RecipeLink>
                           <div className="p-4 flex-1 flex flex-col">
                             <h4 className="text-base font-bold text-slate-800 mb-2 line-clamp-1">{recipe.title}</h4>
                             <div className="mt-auto flex justify-end">
                               {true && ( <Link to={`/profile/recipes/edit/${recipe.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                                   <Edit2 className="w-4 h-4" />
                                 </Link>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                       <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-500 font-medium">لم تقم بإضافة أي وصفات بعد</p>
                     </div>
                   )}
                 </>
              )}
              {activeTab === 'messages' && <div className="mt-6"><UserChat /></div>}
            </div>
          </div>
        </div>
      </div>
      
      <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title="رقم هاتف غير صالح">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <p className="text-slate-600 mb-6 font-medium">
            يجب أن يحتوي رقم الهاتف على 10 أرقام بالضبط.
          </p>
          <Button onClick={() => setIsPhoneModalOpen(false)} className="w-full">
            حسنًا
          </Button>
        </div>
      </Modal>
    </div>
  );
}
