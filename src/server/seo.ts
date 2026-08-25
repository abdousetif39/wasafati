import { db } from './firebaseServer.ts';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function processDynamicSEO(reqUrl: string, host: string, rawHtml: string) {
  let html = rawHtml;
  const domain = `https://${host}`;

  // Ensure absolute URLs for base OG tags
  html = html.replace(/content="\/logo\.png"/g, `content="${domain}/logo.png"`);
  html = html.replace(/content="\/favicon\.png"/g, `content="${domain}/favicon.png"`);

  if (!html.includes('og:url')) {
    html = html.replace('</head>', `<meta property="og:url" content="${domain}${reqUrl}" />\n</head>`);
  }
  if (!html.includes('og:site_name')) {
    html = html.replace('</head>', `<meta property="og:site_name" content="وصفاتي" />\n</head>`);
  }
  if (!html.includes('og:locale')) {
    html = html.replace('</head>', `<meta property="og:locale" content="ar_DZ" />\n</head>`);
  }
  if (!html.includes('twitter:title')) {
     html = html.replace('</head>', `<meta name="twitter:title" content="وصفاتي" />\n<meta name="twitter:description" content="أفضل الوصفات لجميع الأذواق" />\n<meta name="twitter:image" content="${domain}/logo.png" />\n</head>`);
  }

  // Add dynamic recipe SEO if it's a recipe page
  const match = reqUrl.match(/^\/categories\/([^\/]+)\/([^\/?]+)/);
  if (match) {
    const categorySlug = decodeURIComponent(match[1]);
    const recipeSlug = decodeURIComponent(match[2]);

    try {
      // 1. Find category ID
      let categoryId = null;
      const qCat = query(collection(db, 'categories'), where('slug', '==', categorySlug), limit(1));
      const catSnap = await getDocs(qCat);
      if (!catSnap.empty) {
        categoryId = catSnap.docs[0].id;
      }

      if (categoryId) {
        // 2. Find recipe
        let recipe = null;
        const qRecipe = query(collection(db, 'recipes'), where('categoryId', '==', categoryId), where('slug', '==', recipeSlug), where('isPublished', '==', true), limit(1));
        const recipeSnap = await getDocs(qRecipe);
        
        if (!recipeSnap.empty) {
          recipe = recipeSnap.docs[0].data();
        } else {
          // Check previous slugs
          const qRecipePrev = query(collection(db, 'recipes'), where('categoryId', '==', categoryId), where('previousSlugs', 'array-contains', recipeSlug), where('isPublished', '==', true), limit(1));
          const prevSnap = await getDocs(qRecipePrev);
          if (!prevSnap.empty) {
            recipe = prevSnap.docs[0].data();
          }
        }

        if (recipe) {
          const title = `${recipe.title} - وصفاتي`;
          const desc = recipe.shortDescription || recipe.description || "وصفة شهية";
          const img = recipe.mainImage ? (recipe.mainImage.startsWith('http') ? recipe.mainImage : `${domain}${recipe.mainImage}`) : `${domain}/logo.png`;
          const currentUrl = `${domain}/categories/${categorySlug}/${recipe.slug || recipeSlug}`;

          // Replace title
          html = html.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
          
          // Replace descriptions
          html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${desc}" />`);
          html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${desc}" />`);
          html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${desc}" />`);
          
          // Replace OG tags
          html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`);
          html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${img}" />`);
          html = html.replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${currentUrl}" />`);
          
          // Set type to article
          html = html.replace(/<meta property="og:type" content=".*?"\s*\/>/, `<meta property="og:type" content="article" />`);
          
          // Replace Twitter tags
          html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
          html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);
          
          // Add canonical
          html = html.replace('</head>', `<link rel="canonical" href="${currentUrl}" />\n</head>`);
        }
      }
    } catch(e) {
      console.error('Error generating dynamic SEO for recipe:', e);
    }
  } else {
    // Dynamic settings for non-recipe pages
    try {
      const settingsDoc = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data();
        if (settings.siteName) {
            html = html.replace(/<title>.*<\/title>/, `<title>${settings.siteName}</title>`);
            html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${settings.siteName}" />`);
            html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${settings.siteName}" />`);
        }
        if (settings.description) {
            html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${settings.description}" />`);
            html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${settings.description}" />`);
            html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${settings.description}" />`);
        }
        if (settings.logoUrl) {
            const imgUrl = settings.logoUrl.startsWith('http') ? settings.logoUrl : `${domain}${settings.logoUrl}`;
            html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${imgUrl}" />`);
            html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${imgUrl}" />`);
        }
      }
    } catch(e) { console.error("Dynamic settings SEO error:", e); }
  }

  return html;
}
