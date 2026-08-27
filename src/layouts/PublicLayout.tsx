import { CookieConsent } from "../components/ui/CookieConsent";
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl } from '../lib/cloudinary';
import { ChefHat, Search, Menu, X, User } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

function Navbar() {
    const { user, isAdmin } = useAuthStore();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { settings, loading: settingsLoading } = useSettingsStore();
  const location = useLocation();
  const { fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'conversations', `user_${user.id}`), (snap) => {
      if (snap.exists()) {
        setUnreadChatCount(snap.data().userUnreadCount || 0);
      }
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
    return () => unsub();
  }, [user]);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navروابط = [
    { name: 'الرئيسية', href: '/' },
    { name: 'الوصفات', href: '/recipes' },
    { name: 'التصنيفات', href: '/categories' },
    { name: 'عن الموقع', href: '/about' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40 print-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" aria-label="الصفحة الرئيسية">
            {settingsLoading ? (
                <div className="h-[52px] md:h-[58px] lg:h-[64px] w-32 bg-slate-100 rounded-lg animate-pulse"></div>
            ) : settings?.logoUrl ? (
                <img src={optimizeCloudinaryUrl(settings.logoUrl, 200)} alt={settings?.siteName || "وصفاتي"} width="150" height="64" className="h-[52px] md:h-[58px] lg:h-[64px] w-auto object-contain" />
            ) : (
                <div className="flex items-center gap-2">
                    <ChefHat className="h-8 w-8 text-orange-600" />
                    <span className="text-xl font-bold text-slate-900">{settings?.siteName || "وصفاتي"}</span>
                </div>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1 print-hidden">
            {navروابط.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === link.href 
                    ? "text-orange-600 bg-orange-50" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6">
            <form onSubmit={handleSearch} className="relative hidden lg:block">
              <input type="text" id="globalSearchDesktop" name="search" aria-label="بحث" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='البحث...' className="w-64 bg-slate-100 border-none rounded-full py-2.5 pr-11 pl-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all" 
              />
              <button type="submit" aria-label="بحث" className="absolute p-2 right-1 top-1 text-slate-500 hover:text-orange-600 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="w-px h-8 bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-3">
              
              
  
              
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="hidden lg:flex">لوحة التحكم</Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <button className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200 transition-colors">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </button>
                  </Link>
                </div>
              ) : (
                <Link to="/login">
                  <Button variant="primary">تسجيل الدخول</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/search" aria-label="البحث" className="text-slate-500 hover:text-slate-600 p-2 -m-2">
              <Search className="w-6 h-6" />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-slate-900 p-2 -m-2" aria-label="القائمة الرئيسية">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-lg absolute inset-x-0 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative mb-4">
            <input type="text" id="globalSearchMobile" name="search" aria-label="بحث" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='البحث...' className="w-full bg-slate-100 border-none rounded-xl py-3 pr-11 pl-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all" 
            />
            <button type="submit" aria-label="بحث" className="absolute p-2 right-1 top-1 text-slate-500 hover:text-orange-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </form>
          <nav className="flex flex-col gap-4 print-hidden">
            {navروابط.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-slate-800 hover:text-orange-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            
  
            {user ? (
               <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-orange-600 flex items-center gap-2">
                  حسابي
                  {unreadChatCount > 0 && (
                     <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{unreadChatCount}</span>
                  )}
               </Link>
            ) : (
               <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                 <Button variant="primary" className="w-full">تسجيل الدخول</Button>
               </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { settings, loading: settingsLoading } = useSettingsStore();
    return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 print-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="الصفحة الرئيسية">
            {settingsLoading ? (
                <div className="h-[52px] md:h-[58px] lg:h-[64px] w-32 bg-slate-100 rounded-lg animate-pulse"></div>
            ) : settings?.logoUrl ? (
                <img src={optimizeCloudinaryUrl(settings.logoUrl, 200)} alt={settings?.siteName || "وصفاتي"} width="150" height="64" className="h-[52px] md:h-[58px] lg:h-[64px] w-auto object-contain" />
              ) : (
                <ChefHat className="h-8 w-8 text-orange-600" />
              )}
            </Link>
            <p className="text-slate-400 max-w-sm">أفضل الوصفات لجميع الأذواق</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">وصفات مميزة روابط</h2>
            <ul className="space-y-3">
              <li><Link to="/recipes" className="text-slate-400 hover:text-white transition-colors">الوصفات</Link></li>
              <li><Link to="/categories" className="text-slate-400 hover:text-white transition-colors">التصنيفات</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">عن الموقع</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">قانوني</h2>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">شروط الاستخدام</Link></li>
              <li><Link to="/cookies" className="text-slate-400 hover:text-white transition-colors">ملفات تعريف الارتباط</Link></li>
              <li><Link to="/disclaimer" className="text-slate-400 hover:text-white transition-colors">إخلاء المسؤولية</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} {settings?.siteName || 'وصفاتي'}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
