import { SEO } from '../../components/seo/SEO';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChefHat, AlertCircle } from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { getAuthErrorMessage } from '../../lib/authErrors';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function Login() {
    const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Error Modal State
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState({ title: '', message: '' });
  const { settings } = useSettingsStore();
  
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  const handleErrorClose = () => {
    setErrorModalOpen(false);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        let role = 'user';
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          
        const newUserData: any = {
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || 'User',
            role: 'user',
            createdAt: new Date().toISOString()
          };
        await setDoc(userDocRef, newUserData);
        await setDoc(doc(db, 'publicProfiles', userCredential.user.uid), {
          displayName: newUserData.displayName,
          photoURL: newUserData.photoURL || null,
          wilaya: null,
          municipality: null
        }, { merge: true });

        } else {
          role = userDoc.data()?.role || 'user';
        }

        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        
        const newUserData: any = {
          email: userCredential.user.email,
          displayName: name || 'User',
          role: 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUserData);
        await setDoc(doc(db, 'publicProfiles', userCredential.user.uid), {
          displayName: newUserData.displayName,
          photoURL: newUserData.photoURL || null,
          wilaya: null,
          municipality: null
        }, { merge: true });

        
        navigate('/');
      }
    } catch (error: any) {
      if ((error as any)?.code !== 'permission-denied') { console.error(error); }
      setErrorDetails(getAuthErrorMessage(error));
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="تسجيل الدخول" noindex={true} />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center text-orange-600 hover:opacity-80 transition-opacity">
          {settings?.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain mx-auto" /> : <ChefHat className="w-12 h-12" />}
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input
                label="الاسم"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Input
              ref={emailInputRef}
              label="البريد الإلكتروني"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
            <Input
              label="كلمة المرور"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              {loading 
                ? 'جاري تسجيل الدخول...' 
                : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
            </Button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                {isLogin 
                  ? 'ليس لديك حساب؟' 
                  : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={errorModalOpen}
        onClose={handleErrorClose}
        title={errorDetails.title}
      >
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            {errorDetails.message}
          </p>
          <div className="w-full">
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
              onClick={handleErrorClose}
            >إلغاء</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
