export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  photoURL?: string;
  wilaya?: string;
  municipality?: string;
  address?: string;
  phone?: string;
  showPhone?: boolean;
  updatedAt?: string;
  profileSlug?: string;
}

export interface Category {
  id: string;
  name: string; // Used for Arabic
  nameAr?: string; // Legacy
  nameFr?: string; // Legacy
  slug: string;
  previousSlugs?: string[];
  description: string;
  descriptionAr?: string;
  descriptionFr?: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  nameAr?: string;
  nameFr?: string;
  quantity: string;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  titleAr?: string;
  titleFr?: string;
  description: string;
  descriptionAr?: string;
  descriptionFr?: string;
  imageUrl?: string;
}

export interface Recipe {
  id: string;
  title: string;
  titleAr?: string;
  titleFr?: string;
  slug: string;
  previousSlugs?: string[];
  shortDescription: string;
  shortDescriptionAr?: string;
  shortDescriptionFr?: string;
  description: string;
  descriptionAr?: string;
  descriptionFr?: string;
  mainImage: string;
  gallery: string[];
  categoryId: string;
  tags: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: RecipeStep[];
  notes: string;
  nutrition: string; // e.g. Calories: 300kcal
  isPublished: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'draft';
  authorId?: string;
  authorRole?: 'user' | 'admin';
  createdById?: string;
  createdByRole?: 'user' | 'admin';
  updatedById?: string;
  updatedByRole?: 'user' | 'admin';
  isFeatured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  // SEO Fields
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: string;
}

export interface Settings {
  siteName: string;
  logoUrl: string;
  heroImage?: string;
  description: string;
  email: string;
  phone: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  about: string;
  aboutAr?: string;
  aboutFr?: string;
  privacy: string;
  privacyAr?: string;
  privacyFr?: string;
  terms: string;
  termsAr?: string;
  termsFr?: string;
  cookies: string;
  cookiesAr?: string;
  cookiesFr?: string;
  disclaimer: string;
  disclaimerAr?: string;
  disclaimerFr?: string;
  // AdSense
  adsEnabled?: boolean;
  adsPublisherId?: string;
  adsSlotHome?: string;
  adsSlotRecipeList?: string;
  adsSlotRecipe?: string;
  adsSlotSidebar?: string;
}

export interface RecipeUpdate {
  id?: string;
  recipeId: string;
  authorId: string;
  authorRole?: 'user' | 'admin';
  originalData: Partial<Recipe>;
  proposedData: Partial<Recipe>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByRole?: 'user' | 'admin';
  reviewNote?: string;
}

export interface Conversation {
  id?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  lastMessage: string;
  lastMessageAt: string;
  userUnreadCount: number;
  adminUnreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderRole: 'user' | 'admin' | 'system';
  text: string;
  createdAt: string;
  read: boolean;
}
