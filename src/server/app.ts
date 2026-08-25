import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const app = express();
app.use(express.json());

const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

app.get('/api/cloudinary-signature', (req, res) => {
  if (!hasCloudinaryConfig) return res.status(500).json({ error: "Missing environment variable" });
  try {
    const timestamp = Math.round((new Date).getTime()/1000);
    const folder = req.query.folder || 'uploads';
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!);
    res.json({ signature, timestamp, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

app.post('/api/cloudinary-delete', async (req, res) => {
  if (!hasCloudinaryConfig) return res.status(500).json({ error: 'Cloudinary server configuration is incomplete' });
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
    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/recipes</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

    const categoriesMap: Record<string, string> = {};
    const qCats = query(collection(db, 'categories'));
    const catsSnap = await getDocs(qCats);
    catsSnap.docs.forEach(d => { categoriesMap[d.id] = d.data().slug || 'misc'; });

    const qRecipes = query(collection(db, 'recipes'), where('isPublished', '==', true));
    const recipesSnap = await getDocs(qRecipes);
    recipesSnap.docs.forEach(doc => {
      const r = doc.data();
      if (r.slug && r.categoryId && categoriesMap[r.categoryId]) {
        xml += `\n  <url><loc>${domain}/categories/${categoriesMap[r.categoryId]}/${r.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      }
    });

    catsSnap.docs.forEach(doc => {
      const c = doc.data();
      if (c.slug && c.isActive !== false) {
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

export { app };
