export default async function handler(req: any, res: any) {
  try {
    const { getServerDb } = await import('../src/server/firebaseServer');
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    const host = req.headers.host || 'www.wasafati.online';
    const domain = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : `https://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/recipes</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

    let db;
    try {
      db = getServerDb();
    } catch (dbErr: any) {
      console.error('Firebase DB Error in Sitemap Initialization:', { code: dbErr?.code, message: dbErr?.message });
      return res.status(500).json({ error: 'Failed to connect to database for sitemap', details: dbErr?.message });
    }

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
  } catch (e: any) {
    console.error('Sitemap generation error:', { code: e?.code, message: e?.message, stack: e?.stack });
    return res.status(500).json({ error: 'Error generating sitemap', message: e?.message });
  }
}
