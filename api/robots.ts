export default function handler(req: any, res: any) {
  const host = req.headers.host || 'www.wasafati.online';
  const domain = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : `https://${host}`;
  
  const robotsTxt = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /login
Disallow: /profile

Sitemap: ${domain}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(robotsTxt);
}
