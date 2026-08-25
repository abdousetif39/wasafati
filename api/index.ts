import { app } from '../src/server/app.ts';
import { processDynamicSEO } from '../src/server/seo.ts';
import fs from 'node:fs';
import path from 'node:path';

console.log('Vercel API function initialized');

app.use((req, res, next) => {
  console.log('API request:', req.method, req.url, req.originalUrl);
  next();
});

const getDomain = (req: any) => {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/^https?:\/\//, '');
  }
  return req.headers.host || 'www.wasafati.online';
};

app.get('/categories/:categorySlug/:recipeSlug', async (req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = '';

    if (fs.existsSync(indexPath)) {
      html = fs.readFileSync(indexPath, 'utf8');
    } else {
      console.error('Template not found at:', indexPath);
      html = '<!DOCTYPE html><html><head><title>وصفاتي</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
    }

    const host = getDomain(req);
    html = await processDynamicSEO(req.originalUrl || req.url, host, html);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.send(html);
  } catch (err) {
    console.error('Vercel API error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Vercel catch-all fallback if rewritten directly to /api
app.get('/api', async (req, res, next) => {
  const originalUrl = req.originalUrl || req.url;
  if (originalUrl.includes('/categories/')) {
    try {
      const indexPath = path.join(process.cwd(), 'dist', 'index.html');
      let html = '';
  
      if (fs.existsSync(indexPath)) {
        html = fs.readFileSync(indexPath, 'utf8');
      } else {
        console.error('Template not found at:', indexPath);
        html = '<!DOCTYPE html><html><head><title>وصفاتي</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
      }
  
      const host = getDomain(req);
      html = await processDynamicSEO(originalUrl, host, html);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.send(html);
    } catch (err) {
      console.error('Vercel API error:', err);
      return res.status(500).send('Internal Server Error');
    }
  }
  next();
});

export default app;
