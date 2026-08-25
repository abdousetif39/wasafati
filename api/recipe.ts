import fs from 'node:fs';
import path from 'node:path';

export default async function handler(req: any, res: any) {
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const {
      initializeFirestore,
      getFirestore,
      collection,
      query,
      where,
      getDocs
    } = await import('firebase/firestore');

    // Extract slugs
    let categorySlug = '';
    let recipeSlug = '';

    if (req.query && req.query.categorySlug && req.query.recipeSlug) {
      categorySlug = decodeURIComponent(req.query.categorySlug);
      recipeSlug = decodeURIComponent(req.query.recipeSlug);
    } else {
      // Fallback parsing from URL /categories/:catSlug/:recSlug
      const match = req.url?.match(/\/categories\/([^\/]+)\/([^\/?]+)/);
      if (match) {
        categorySlug = decodeURIComponent(match[1]);
        recipeSlug = decodeURIComponent(match[2]);
      }
    }

    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.error('Template not found at:', indexPath);
      return res.status(500).json({ error: 'Template not found.' });
    }

    let html = fs.readFileSync(indexPath, 'utf8');
    let host = req.headers.host || 'www.wasafati.online';
    if (process.env.SITE_URL) {
      host = process.env.SITE_URL.replace(/^https?:\/\//, '');
    }
    const siteUrl = `https://${host}`;
    const canonicalUrl = `${siteUrl}/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(recipeSlug)}`;

    if (!categorySlug || !recipeSlug) {
      // Serve default html if not matched
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    const firebaseConfig = {
      projectId: "gen-lang-client-0660389049",
      appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
      apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
      authDomain: "gen-lang-client-0660389049.firebaseapp.com",
      storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
      messagingSenderId: "1097085216661",
    };

    const apps = getApps();
    const app = apps.some(a => a.name === 'serverRecipeApp')
      ? getApp('serverRecipeApp')
      : initializeApp(firebaseConfig, 'serverRecipeApp');

    let db;
    try {
      db = getFirestore(app, 'ai-studio-6180126a-591b-4f63-b44a-d513c9233feb');
    } catch {
      db = initializeFirestore(
        app,
        { experimentalAutoDetectLongPolling: true },
        'ai-studio-6180126a-591b-4f63-b44a-d513c9233feb'
      );
    }

    // Fetch category
    let categoryId = null;
    let categoryName = '';
    const qCat = query(collection(db, 'categories'), where('slug', '==', categorySlug));
    const catSnap = await getDocs(qCat);
    if (!catSnap.empty) {
      categoryId = catSnap.docs[0].id;
      categoryName = catSnap.docs[0].data().name || categorySlug;
    }

    // Fetch recipe
    let recipeData = null;
    if (categoryId) {
      const qRec = query(
        collection(db, 'recipes'),
        where('categoryId', '==', categoryId),
        where('slug', '==', recipeSlug),
        where('isPublished', '==', true)
      );
      const recSnap = await getDocs(qRec);
      if (!recSnap.empty) {
        recipeData = recSnap.docs[0].data();
      } else {
        // Check previous slugs
        const qRecPrev = query(
          collection(db, 'recipes'),
          where('categoryId', '==', categoryId),
          where('previousSlugs', 'array-contains', recipeSlug),
          where('isPublished', '==', true)
        );
        const recPrevSnap = await getDocs(qRecPrev);
        if (!recPrevSnap.empty) {
          recipeData = recPrevSnap.docs[0].data();
        }
      }
    }

    if (recipeData) {
      const title = `${recipeData.title} | وصفاتي`;
      const description = recipeData.description || `طريقة عمل ${recipeData.title} في قسم ${categoryName}`;
      const ogImage = recipeData.coverImage || recipeData.thumbnailUrl || `${siteUrl}/default-og.jpg`;

      // Replace tags safely
      html = html
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"\s+content="[^"]*">/, '')
        .replace(/<meta\s+property="og:title"\s+content="[^"]*">/, '')
        .replace(/<meta\s+property="og:description"\s+content="[^"]*">/, '')
        .replace(/<meta\s+property="og:image"\s+content="[^"]*">/, '')
        .replace(/<meta\s+property="og:url"\s+content="[^"]*">/, '')
        .replace(/<meta\s+name="twitter:title"\s+content="[^"]*">/, '')
        .replace(/<meta\s+name="twitter:description"\s+content="[^"]*">/, '')
        .replace(/<meta\s+name="twitter:image"\s+content="[^"]*">/, '')
        .replace(/<link\s+rel="canonical"\s+href="[^"]*">/, '');

      const extraMeta = `
        <meta name="description" content="${description}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${ogImage}">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:type" content="article">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${ogImage}">
        <link rel="canonical" href="${canonicalUrl}">
      `;
      html = html.replace('</head>', `${extraMeta}</head>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);

  } catch (error: any) {
    console.error('RECIPE ROUTE ERROR', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });
    return res.status(500).json({
      ok: false,
      code: error?.code || error?.name || 'unknown',
      message: error?.message || 'Recipe route error'
    });
  }
}
