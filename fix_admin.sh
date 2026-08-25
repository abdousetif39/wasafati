#!/bin/bash
cat << 'INNER_EOF' > src/layouts/AdminLayout.tsx
import { SEO } from '../components/seo/SEO';
import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ChefHat, LayoutDashboard, Utensils, Users, Settings, Tag, LogOut, Menu, Mail , MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export function AdminLayout() {
  const { isAdmin, loading, logout, isInitialized } = useAuthStore();
  const { settings } = useSettingsStore();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  
  const location = useLocation();

  React.useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'conversations'), where('adminUnreadCount', '>', 0));
    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.docs.forEach(doc => {
        count += doc.data().adminUnreadCount;
      });
      setUnreadChatCount(count);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
    return () => unsub();
  }, [isAdmin]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { name: 'الوصفات', href: '/admin/recipes', icon: Utensils },
    { name: 'التعديلات', href: '/admin/updates', icon: Tag },
    { name: 'التصنيفات', href: '/admin/categories', icon: Tag },
    { name: 'المستخدمين', href: '/admin/users', icon: Users },
    { name: 'رسائل اتصل بنا', href: '/admin/messages', icon: Mail },
    { name: 'المحادثات', href: '/admin/chat', icon: MessageSquare },
    { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <SEO title="لوحة التحكم" noindex={true} />

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-e border-slate-200 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/admin" className="flex items-center gap-2" aria-label="الصفحة الرئيسية">
            {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings?.siteName || "وصفاتي"} className="max-h-[48px] w-auto object-contain print-hidden" />
            ) : (
                <div className="flex items-center gap-2 print-hidden">
                    <ChefHat className="h-8 w-8 text-orange-600" />
                    <span className="text-xl font-bold text-slate-900">{settings?.siteName || "وصفاتي"}</span>
                </div>
            )}
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-orange-50 text-orange-600" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-200">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
            <LogOut className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800 ">
            {navItems.find(item => item.href === location.pathname)?.name || 'لوحة التحكم'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
INNER_EOF
