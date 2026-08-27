import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
// AdminLayout removed from static imports
import Home from './pages/public/Home';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useCategoriesStore } from './store/useCategoriesStore';
import { HelmetProvider } from 'react-helmet-async';
// MessageNotificationListener removed from static imports
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

// Lazy loaded components
const MessageNotificationListener = React.lazy(() => import('./components/chat/MessageNotificationListener').then(m => ({ default: m.MessageNotificationListener })));
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const CategoryList = React.lazy(() => import('./pages/admin/categories/CategoryList'));
const RecipeList = React.lazy(() => import('./pages/admin/recipes/RecipeList'));
const RecipeUpdateList = React.lazy(() => import('./pages/admin/updates/RecipeUpdateList'));
const RecipeForm = React.lazy(() => import('./pages/admin/recipes/RecipeForm'));
const RecipeDetail = React.lazy(() => import('./pages/public/recipes/RecipeDetail'));
const Settings = React.lazy(() => import('./pages/admin/settings/Settings'));
const InfoPage = React.lazy(() => import('./pages/public/info/InfoPage'));
const Contact = React.lazy(() => import('./pages/public/info/Contact'));
const NotFound = React.lazy(() => import('./pages/public/NotFound'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Profile = React.lazy(() => import('./pages/public/Profile'));
const UserPublicProfile = React.lazy(() => import('./pages/public/UserPublicProfile'));
const UserRecipeForm = React.lazy(() => import('./pages/public/recipes/UserRecipeForm'));
const RecipeListPublic = React.lazy(() => import('./pages/public/recipes/RecipeListPublic'));
const CategoryListPublic = React.lazy(() => import('./pages/public/categories/CategoryListPublic'));
const CategoryDetail = React.lazy(() => import('./pages/public/categories/CategoryDetail'));
const Search = React.lazy(() => import('./pages/public/Search'));
const UserList = React.lazy(() => import('./pages/admin/users/UserList'));
const MessageList = React.lazy(() => import('./pages/admin/messages/MessageList'));
const ChatList = React.lazy(() => import('./pages/admin/chat/ChatList'));

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
  </div>
);

function App() {
  const user = useAuthStore((state) => state.user);
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
            <Suspense fallback={<LoadingFallback />}>
              {user && <MessageNotificationListener />}
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
            </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

export default App;
