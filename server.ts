import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/config/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

console.log('Backend cwd:', process.cwd());
console.log('Cloudinary env status:', {
  cloudName: Boolean(CLOUDINARY_CLOUD_NAME),
  apiKey: Boolean(CLOUDINARY_API_KEY),
  apiSecret: Boolean(CLOUDINARY_API_SECRET),
});

const hasCloudinaryConfig = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
} else {
  console.warn("Cloudinary configuration is incomplete.");
}







async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  
  app.use(express.json());

  app.get('/api/cloudinary-signature', (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName) return res.status(500).json({ error: "Missing environment variable", variable: "CLOUDINARY_CLOUD_NAME" });
    if (!apiKey) return res.status(500).json({ error: "Missing environment variable", variable: "CLOUDINARY_API_KEY" });
    if (!apiSecret) return res.status(500).json({ error: "Missing environment variable", variable: "CLOUDINARY_API_SECRET" });
    
          try {
      const timestamp = Math.round((new Date).getTime()/1000);
      const folder = req.query.folder || 'uploads';
      
      const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        folder: folder
      }, process.env.CLOUDINARY_API_SECRET);

      res.json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to generate signature' });
    }
  });


  app.post('/api/cloudinary-delete', async (req, res) => {
    if (!hasCloudinaryConfig) {
      return res.status(500).json({ error: 'Cloudinary server configuration is incomplete' });
    }
    
          try {
      const { publicId } = req.body;
      if (!publicId) return res.status(400).json({ error: 'Missing publicId' });
      
      const result = await cloudinary.uploader.destroy(publicId);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
          try {
      const domain = `https://${req.get('host')}`;
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/recipes</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/privacy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/disclaimer</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/cookies</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`;

      // Get Published Recipes
      const categoriesMap: Record<string, string> = {};
      try {
        const qCats = query(collection(db, 'categories'));
        const catsSnap = await getDocs(qCats);
        catsSnap.docs.forEach(d => { categoriesMap[d.id] = d.data().slug || 'misc'; });
      } catch(e) {}
      // Fetch categories first to map them for recipes
            try {
        const qCats = query(collection(db, 'categories'));
        const catsSnap = await getDocs(qCats);
        catsSnap.docs.forEach(d => { categoriesMap[d.id] = d.data().slug || 'misc'; });
      } catch(e) {}
      
            const qRecipes = query(collection(db, 'recipes'), where('isPublished', '==', true));
      const recipesSnap = await getDocs(qRecipes);
      recipesSnap.docs.forEach(doc => {
        const r = doc.data();
        if (r.slug) {
          const cSlug = categoriesMap[r.categoryId] || 'misc';
          xml += `\n  <url><loc>${domain}/categories/${cSlug}/${r.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
        }
      });

      // Get Categories
      const qCats = query(collection(db, 'categories'), where('isActive', '==', true));
      const catsSnap = await getDocs(qCats);
      catsSnap.docs.forEach(doc => {
        const c = doc.data();
        
        if (c.slug) {
          xml += `\n  <url><loc>${domain}/categories/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
        }
      });

      xml += `\n</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (e) {
      console.error('Sitemap generation error:', e);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', (req, res) => {
    const domain = `https://${req.get('host')}`;
    res.type('text/plain');
    res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /login\nDisallow: /profile\n\nSitemap: ${domain}/sitemap.xml`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      try {
        const domain = `https://${req.get('host')}`;
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
        
        // Ensure absolute URL for og:image so social platforms can see it
        html = html.replace(/content="\/logo.png"/g, `content="${domain}/logo.png"`);
        html = html.replace(/content="\/favicon.png"/g, `content="${domain}/favicon.png"`);
        
        // Add og:url
        if (!html.includes('og:url')) {
           html = html.replace('</head>', `<meta property="og:url" content="${domain}${req.originalUrl}" />\n</head>`);
        }
        
        // Add dynamic recipe SEO if it's a recipe page!
        const match = req.originalUrl.match(/^\/categories\/[^\/]+\/([^\/?]+)/);
        if (match && match[1]) {
           const slug = match[1];
           try {
             // Let's try to fetch the recipe to inject its specific OG tags!
             const q = query(collection(db, 'recipes'), where('slug', '==', slug), limit(1));
             const snap = await getDocs(q);
             if (!snap.empty) {
                const recipe = snap.docs[0].data();
                if (recipe.title) {
                   html = html.replace(/<title>.*<\/title>/, `<title>${recipe.title} - وصفاتي</title>`);
                   html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${recipe.title}" />`);
                }
                if (recipe.shortDescription) {
                   html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${recipe.shortDescription}" />`);
                   html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${recipe.shortDescription}" />`);
                }
                if (recipe.mainImage) {
                   // optimize cloudinary url if possible, but raw works
                   html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${recipe.mainImage}" />`);
                }
             }
           } catch(e) {}
        }
        
        // Settings dynamic logo
        try {
           const settingsDoc = await getDocs(query(collection(db, 'settings'), limit(1)));
           if (!settingsDoc.empty) {
               const settings = settingsDoc.docs[0].data();
               if (settings.siteName) {
                   // Only replace if we didn't already replace it with recipe title
                   if (!match) {
                      html = html.replace(/<title>.*<\/title>/, `<title>${settings.siteName}</title>`);
                      html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${settings.siteName}" />`);
                   }
               }
               if (settings.description && !match) {
                   html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${settings.description}" />`);
                   html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${settings.description}" />`);
               }
               if (settings.logoUrl && !match) {
                   html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${settings.logoUrl}" />`);
               }
           }
        } catch(e) {}
        
        res.send(html);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
