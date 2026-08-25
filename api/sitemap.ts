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

    const firebaseConfig = {
      projectId: "gen-lang-client-0660389049",
      appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
      apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
      authDomain: "gen-lang-client-0660389049.firebaseapp.com",
      storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
      messagingSenderId: "1097085216661",
    };

    const apps = getApps();
    const app = apps.some(a => a.name === 'serverSitemapApp')
      ? getApp('serverSitemapApp')
      : initializeApp(firebaseConfig, 'serverSitemapApp');

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

    const host = req.headers.host || 'www.wasafati.online';
    const domain = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : `https://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/recipes</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

    const categoriesMap: Record<string, string> = {};
    const qCats = query(collection(db, 'categories'));
    const catsSnap = await getDocs(qCats);
    
    catsSnap.docs.forEach((d: any) => { categoriesMap[d.id] = d.data().slug || 'misc'; });

    const qRecipes = query(collection(db, 'recipes'), where('isPublished', '==', true));
    const recipesSnap = await getDocs(qRecipes);
    
    recipesSnap.docs.forEach((doc: any) => {
      const r = doc.data();
      if (r.slug && r.categoryId && categoriesMap[r.categoryId]) {
        xml += `\n  <url><loc>${domain}/categories/${categoriesMap[r.categoryId]}/${r.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      }
    });

    catsSnap.docs.forEach((doc: any) => {
      const c = doc.data();
      if (c.slug && c.isActive !== false) {
        xml += `\n  <url><loc>${domain}/categories/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }
    });

    xml += `\n</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(xml);
  } catch (error: any) {
    console.error('SITEMAP GENERATION ERROR', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });
    return res.status(500).json({
      ok: false,
      code: error?.code || error?.name || 'unknown',
      message: error?.message || 'Sitemap error'
    });
  }
}
