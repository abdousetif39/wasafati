import { getServerDb } from './firebaseServer';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

function escapeHtml(unsafe: string) {
  return (unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function processDynamicSEO(reqUrl: string, host: string, rawHtml: string) {
  let html = rawHtml;
  const domain = `https://${host}`;

let _cachedSettings = null;
let _cachedSettingsTime = 0;
let _recipeCache = new Map();
  let db;
  try {
    db = getServerDb();
  } catch (err) {
    console.error('Error getting server db in seo.ts:', err);
    return html; // Return without dynamic data if DB fails
  }

  // Add dynamic recipe SEO if it's a recipe page
  const match = reqUrl.match(/^\/categories\/([^\/]+)\/([^\/?]+)/);
  if (match) {
    const categorySlug = decodeURIComponent(match[1]);
    const recipeSlug = decodeURIComponent(match[2]);
    try {
      // 1. Find category ID
      let categoryId = null;
      let categoryName = '';
      const qCat = query(collection(db, 'categories'), where('slug', '==', categorySlug), limit(1));
      const catSnap = await getDocs(qCat);
      
      if (!catSnap.empty) {
        categoryId = catSnap.docs[0].id;
        categoryName = catSnap.docs[0].data().name || categorySlug;
      }

      if (categoryId) {
        // 2. Find recipe
        let recipeData: any = null;
        const now = Date.now();
        const cacheKey = categoryId + "_" + recipeSlug;
        const cached = _recipeCache.get(cacheKey);
        if (cached && (now - cached.time < 60000)) {
          recipeData = cached.data;
        } else {
        const qRecipe = query(collection(db, 'recipes'), where('categoryId', '==', categoryId), where('slug', '==', recipeSlug), where('isPublished', '==', true), limit(1));
        const recipeSnap = await getDocs(qRecipe);
        
        if (!recipeSnap.empty) {
          recipeData = recipeSnap.docs[0].data();
        } else {
          // Check previous slugs
          const qRecipePrev = query(collection(db, 'recipes'), where('categoryId', '==', categoryId), where('previousSlugs', 'array-contains', recipeSlug), where('isPublished', '==', true), limit(1));
          const prevSnap = await getDocs(qRecipePrev);
          if (!prevSnap.empty) {
            recipeData = prevSnap.docs[0].data();
          }
        }

        if (recipeData) {
          _recipeCache.set(cacheKey, { time: now, data: recipeData });
        }
        } // end of else block

        if (recipeData) {
          let recipeTitle = recipeData.seoTitle || recipeData.title || '';
          let title = recipeTitle ? `${recipeTitle} - وصفاتي` : 'وصفاتي';
          
          let rawDesc = recipeData.seoDescription || recipeData.shortDescription || recipeData.description || '';
          let description = rawDesc.substring(0, 160);
          
          let rawImage = recipeData.socialImage || recipeData.mainImage || recipeData.coverImage || recipeData.thumbnailUrl;
          let ogImage = rawImage;
          if (!ogImage) {
            ogImage = `${domain}/logo.png`;
          } else if (!ogImage.startsWith('http')) {
            ogImage = ogImage.startsWith('/') ? `${domain}${ogImage}` : `${domain}/${ogImage}`;
          }

          title = escapeHtml(title);
          description = escapeHtml(description);
          ogImage = escapeHtml(ogImage);
          const canonicalUrl = `${domain}/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(recipeSlug)}`;

          // Clean up existing tags
          html = html
            .replace(/<title>.*?<\/title>/gi, '')
            .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+property="og:locale"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/gi, '')
            .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');

          let imageTypeMeta = '';
          if (ogImage.includes('.jpg') || ogImage.includes('.jpeg')) {
              imageTypeMeta = '<meta property="og:image:type" content="image/jpeg">';
          } else if (ogImage.includes('.png')) {
              imageTypeMeta = '<meta property="og:image:type" content="image/png">';
          } else if (ogImage.includes('.webp')) {
              imageTypeMeta = '<meta property="og:image:type" content="image/webp">';
          }

          const extraMeta = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="وصفاتي">
    <meta property="og:locale" content="ar_DZ">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    ${imageTypeMeta}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="canonical" href="${canonicalUrl}">
`;
          html = html.replace('</head>', `${extraMeta}</head>`);
        }
      }
    } catch(e) {
      console.error('Error generating dynamic SEO for recipe:', e);
    }
  } else {
    // Dynamic settings for non-recipe pages
    try {
      let settings = null;
      const now = Date.now();
      if (_cachedSettings && (now - _cachedSettingsTime < 60000)) {
        settings = _cachedSettings;
      } else {
        const settingsDoc = await getDocs(query(collection(db, 'settings'), limit(1)));
        if (!settingsDoc.empty) {
          settings = settingsDoc.docs[0].data();
          _cachedSettings = settings;
          _cachedSettingsTime = now;
        }
      }
      if (settings) {
        let siteName = settings.siteName ? escapeHtml(settings.siteName) : "وصفاتي";
        let desc = settings.description ? escapeHtml(settings.description) : "أفضل الوصفات لجميع الأذواق";
        
        // Remove existing to avoid dupes
        html = html
          .replace(/<title>.*?<\/title>/gi, '')
          .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, '')
          .replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/gi, '');
          
        let ogImage = settings.logoUrl || '/logo.png';
        ogImage = ogImage.startsWith('http') ? ogImage : `${domain}${ogImage}`;
        ogImage = escapeHtml(ogImage);

        const currentUrl = `${domain}${reqUrl}`;

        const extraMeta = `
    <title>${siteName}</title>
    <meta name="description" content="${desc}">
    <meta property="og:title" content="${siteName}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="وصفاتي">
    <meta property="og:locale" content="ar_DZ">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${siteName}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${ogImage}">
`;
        html = html.replace('</head>', `${extraMeta}</head>`);
      }
    } catch(e) { console.error("Dynamic settings SEO error:", e); }
  }

  return html;
}
