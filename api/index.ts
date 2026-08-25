import { app } from '../src/server/app';
import { processDynamicSEO } from '../src/server/seo';
import fs from 'fs';
import path from 'path';

// Expose processDynamicSEO as a route in the app specifically for Vercel SSR
app.get('/categories/:categorySlug/:recipeSlug', async (req, res) => {
  try {
    let html = '';
    
    // In Vercel, the includeFiles "dist/index.html" is placed relative to project root.
    // __dirname in api/index.ts is /var/task/api. So dist/index.html is at ../dist/index.html
    const distIndex = path.join(__dirname, '../dist/index.html');
    const rootIndex = path.join(__dirname, '../index.html');
    const cwdDist = path.join(process.cwd(), 'dist', 'index.html');
    const cwdRoot = path.join(process.cwd(), 'index.html');

    if (fs.existsSync(distIndex)) {
        html = fs.readFileSync(distIndex, 'utf8');
    } else if (fs.existsSync(rootIndex)) {
        html = fs.readFileSync(rootIndex, 'utf8');
    } else if (fs.existsSync(cwdDist)) {
        html = fs.readFileSync(cwdDist, 'utf8');
    } else if (fs.existsSync(cwdRoot)) {
        html = fs.readFileSync(cwdRoot, 'utf8');
    } else {
        html = '<!DOCTYPE html><html><head><title>وصفاتي</title></head><body>Error loading template</body></html>';
    }
    
    html = await processDynamicSEO(req.originalUrl, req.headers.host || 'localhost', html);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default app;
