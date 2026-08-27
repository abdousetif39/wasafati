#!/bin/bash
cat << 'INNER_EOF' > src/components/seo/AutoSEO.tsx
import React from 'react';
import { SEO } from './SEO';
import { Recipe, Category } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';

interface AutoSEOProps {
  authorName?: string;
  authorPhotoUrl?: string;
  authorUrl?: string;
  recipe?: Recipe;
  category?: Category;
  type: 'website' | 'article' | 'recipe';
}

export const AutoSEO: React.FC<AutoSEOProps> = ({ recipe, category, type, authorName, authorPhotoUrl, authorUrl }) => {
  const { settings } = useSettingsStore();
  const domain = window.location.origin;

  let title = settings?.siteName || 'وصفاتي';
  let description = settings?.description || 'اكتشف أشهى الوصفات وألذ الأطباق';
  let image = settings?.heroImage || settings?.logoUrl || '';
  let canonical = domain;
  let schema: any = null;

  if (recipe) {
    title = recipe.seoTitle || recipe.title;
    description = (recipe.seoDescription || recipe.shortDescription || recipe.description || '').substring(0, 160);
    
    // Cast to any to access potential fields not in Recipe type just in case
    const r: any = recipe;
    let ogImage = r.socialImage || r.mainImage || r.coverImage || r.thumbnailUrl;
    
    if (!ogImage) {
      ogImage = `${domain}/logo.png`;
    } else if (!ogImage.startsWith('http')) {
      ogImage = ogImage.startsWith('/') ? `${domain}${ogImage}` : `${domain}/${ogImage}`;
    }
    image = ogImage;
    
    canonical = `${domain}/categories/${category?.slug || 'misc'}/${recipe.slug}`;
      
    // Generate Schema.org
    let authorSchema: any = settings?.siteName ? {
      "@type": "Organization",
      "name": settings?.siteName
    } : undefined;
    
    if (authorName) {
      authorSchema = {
        "@type": "Person",
        "name": authorName,
        "url": authorUrl,
        "image": authorPhotoUrl
      };
    }
    
    schema = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.title,
      "author": authorSchema,
      "image": image ? [image] : undefined,
      "description": description,
      "prepTime": `PT${recipe.prepTime || 0}M`,
      "cookTime": `PT${recipe.cookTime || 0}M`,
      "totalTime": `PT${recipe.totalTime || 0}M`,
      "recipeYield": recipe.servings,
      "recipeCategory": category?.name || "طبق رئيسي",
      "recipeIngredient": recipe.ingredients?.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`),
      "recipeInstructions": recipe.steps?.map((step) => ({
        "@type": "HowToStep",
        "name": step.title || `الخطوة ${step.stepNumber}`,
        "text": step.description,
        "url": canonical,
        "image": step.imageUrl
      }))
    };
  } else if (category) {
    title = `${category.name}`;
    description = category.description || `أفضل وصفات ${category.name}`;
    image = category.imageUrl || image;
    canonical = `${domain}/categories/${category.slug}`;
  }

  return (
    <SEO 
      title={title} 
      description={description} 
      image={image} 
      canonical={canonical} 
      type={type} 
      schema={schema}
      noindex={recipe ? !recipe.isPublished : false}
    />
  );
};
INNER_EOF
