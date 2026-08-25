import { processDynamicSEO } from '../src/server/seo';
import fs from 'node:fs';
import path from 'node:path';

export default async function handler(req: any, res: any) {
  try {
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = '';

    if (fs.existsSync(indexPath)) {
      html = fs.readFileSync(indexPath, 'utf8');
    } else {
      console.error('Template not found at:', indexPath);
      html = '<!DOCTYPE html><html><head><title>وصفاتي</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
    }

    // In Vercel, if rewrites are used with path segments (like /categories/:categorySlug/:recipeSlug),
    // they are populated in req.query. We reconstruct the path for the SEO processor.
    let originalUrl = req.url || '/';
    if (req.query && req.query.categorySlug && req.query.recipeSlug) {
      originalUrl = `/categories/${encodeURIComponent(req.query.categorySlug)}/${encodeURIComponent(req.query.recipeSlug)}`;
    } else if (req.headers['x-now-route-matches']) {
       // fallback for Vercel internal headers if needed, but req.query is standard
    }

    let host = req.headers.host || 'www.wasafati.online';
    if (process.env.SITE_URL) {
      host = process.env.SITE_URL.replace(/^https?:\/\//, '');
    }

    html = await processDynamicSEO(originalUrl, host, html);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('Vercel Recipe Route error:', { code: err?.code, message: err?.message, stack: err?.stack });
    return res.status(500).json({ error: 'Internal Server Error', message: err?.message });
  }
}
