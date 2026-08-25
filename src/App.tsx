import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import Home from './pages/public/Home';
import Dashboard from './pages/admin/Dashboard';
import CategoryList from './pages/admin/categories/CategoryList';
import RecipeList from './pages/admin/recipes/RecipeList';
import RecipeUpdateList from './pages/admin/updates/RecipeUpdateList';
import RecipeForm from './pages/admin/recipes/RecipeForm';
import RecipeDetail from './pages/public/recipes/RecipeDetail';
import Settings from './pages/admin/settings/Settings';
import InfoPage from './pages/public/info/InfoPage';
import Contact from './pages/public/info/Contact';
import NotFound from './pages/public/NotFound';
import Login from './pages/auth/Login';
import Profile from './pages/public/Profile';
import UserPublicProfile from './pages/public/UserPublicProfile';
import UserRecipeForm from './pages/public/recipes/UserRecipeForm';
import RecipeListPublic from './pages/public/recipes/RecipeListPublic';
import CategoryListPublic from './pages/public/categories/CategoryListPublic';
import CategoryDetail from './pages/public/categories/CategoryDetail';
import Search from './pages/public/Search';
import UserList from './pages/admin/users/UserList';
import MessageList from './pages/admin/messages/MessageList';
import ChatList from './pages/admin/chat/ChatList';

import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useCategoriesStore } from './store/useCategoriesStore';
import { HelmetProvider } from 'react-helmet-async';

import { MessageNotificationListener } from './components/chat/MessageNotificationListener';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';


function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  useEffect(() => {
    initializeAuth();
    fetchSettings();
    fetchCategories();
  }, [initializeAuth, fetchSettings, fetchCategories]);

  return (
    <HelmetProvider>
      <ToastProvider>
        <ConfirmProvider>
      <BrowserRouter>
        <MessageNotificationListener />
        
        <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="recipes" element={<RecipeListPublic />} />
          <Route path="recipes/:slug" element={<RecipeDetail />} />
          <Route path="categories" element={<CategoryListPublic />} />
          <Route path="categories/:slug" element={<CategoryDetail />} />
          <Route path="categories/:categorySlug/:recipeSlug" element={<RecipeDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileSlug" element={<UserPublicProfile />} />
          <Route path="profile/recipes/new" element={<UserRecipeForm />} />
          <Route path="profile/recipes/edit/:id" element={<UserRecipeForm />} />
          <Route path="about" element={<InfoPage type="about" />} />
          <Route path="privacy" element={<InfoPage type="privacy" />} />
          <Route path="terms" element={<InfoPage type="terms" />} />
          <Route path="disclaimer" element={<InfoPage type="disclaimer" />} />
          <Route path="cookies" element={<InfoPage type="cookies" />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="recipes" element={<RecipeList />} />
          <Route path="updates" element={<RecipeUpdateList />} />
          <Route path="recipes/new" element={<RecipeForm />} />
          <Route path="recipes/edit/:id" element={<RecipeForm />} />
          <Route path="users" element={<UserList />} />
          <Route path="messages" element={<MessageList />} />
          <Route path="chat" element={<ChatList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
            </ConfirmProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

export default App;
