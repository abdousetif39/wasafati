var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

// src/server/app.ts
var import_express = __toESM(require("express"), 1);
var import_cloudinary = require("cloudinary");

// src/server/firebaseServer.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var firebaseConfig = {
  projectId: "gen-lang-client-0660389049",
  appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
  apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
  authDomain: "gen-lang-client-0660389049.firebaseapp.com",
  storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
  messagingSenderId: "1097085216661"
};
var apps = (0, import_app.getApps)();
var isInitialized = apps.some((a) => a.name === "serverApp");
var app = isInitialized ? (0, import_app.getApp)("serverApp") : (0, import_app.initializeApp)(firebaseConfig, "serverApp");
var db = isInitialized ? (0, import_firestore.getFirestore)(app, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb") : (0, import_firestore.initializeFirestore)(app, { experimentalAutoDetectLongPolling: true }, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb");

// src/server/app.ts
var import_firestore2 = require("firebase/firestore");
var app2 = (0, import_express.default)();
app2.use(import_express.default.json());
var hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
if (hasCloudinaryConfig) {
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}
app2.get("/api/cloudinary-signature", (req, res) => {
  if (!hasCloudinaryConfig) return res.status(500).json({ error: "Missing environment variable" });
  try {
    const timestamp = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
    const folder = req.query.folder || "uploads";
    const signature = import_cloudinary.v2.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
    res.json({ signature, timestamp, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate signature" });
  }
});
app2.post("/api/cloudinary-delete", async (req, res) => {
  if (!hasCloudinaryConfig) return res.status(500).json({ error: "Cloudinary server configuration is incomplete" });
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: "Missing publicId" });
    const result = await import_cloudinary.v2.uploader.destroy(publicId);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete image" });
  }
});
app2.get("/sitemap.xml", async (req, res) => {
  try {
    const domain = `https://${req.get("host")}`;
    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/recipes</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    const categoriesMap = {};
    const qCats = (0, import_firestore2.query)((0, import_firestore2.collection)(db, "categories"));
    const catsSnap = await (0, import_firestore2.getDocs)(qCats);
    catsSnap.docs.forEach((d) => {
      categoriesMap[d.id] = d.data().slug || "misc";
    });
    const qRecipes = (0, import_firestore2.query)((0, import_firestore2.collection)(db, "recipes"), (0, import_firestore2.where)("isPublished", "==", true));
    const recipesSnap = await (0, import_firestore2.getDocs)(qRecipes);
    recipesSnap.docs.forEach((doc2) => {
      const r = doc2.data();
      if (r.slug && r.categoryId && categoriesMap[r.categoryId]) {
        xml += `
  <url><loc>${domain}/categories/${categoriesMap[r.categoryId]}/${r.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      }
    });
    catsSnap.docs.forEach((doc2) => {
      const c = doc2.data();
      if (c.slug && c.isActive !== false) {
        xml += `
  <url><loc>${domain}/categories/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }
    });
    xml += `
</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    console.error("Sitemap generation error:", e);
    res.status(500).send("Error generating sitemap");
  }
});
app2.get("/robots.txt", (req, res) => {
  const domain = `https://${req.get("host")}`;
  res.type("text/plain");
  res.send(`User-agent: *
Disallow: /admin/
Disallow: /login
Disallow: /profile

Sitemap: ${domain}/sitemap.xml`);
});
app2.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    runtime: "vercel"
  });
});
app2.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  res.status(500).json({
    error: "Internal server error"
  });
});

// src/server/seo.ts
var import_firestore3 = require("firebase/firestore");
async function processDynamicSEO(reqUrl, host, rawHtml) {
  let html = rawHtml;
  const domain = `https://${host}`;
  html = html.replace(/content="\/logo\.png"/g, `content="${domain}/logo.png"`);
  html = html.replace(/content="\/favicon\.png"/g, `content="${domain}/favicon.png"`);
  if (!html.includes("og:url")) {
    html = html.replace("</head>", `<meta property="og:url" content="${domain}${reqUrl}" />
</head>`);
  }
  if (!html.includes("og:site_name")) {
    html = html.replace("</head>", `<meta property="og:site_name" content="\u0648\u0635\u0641\u0627\u062A\u064A" />
</head>`);
  }
  if (!html.includes("og:locale")) {
    html = html.replace("</head>", `<meta property="og:locale" content="ar_DZ" />
</head>`);
  }
  if (!html.includes("twitter:title")) {
    html = html.replace("</head>", `<meta name="twitter:title" content="\u0648\u0635\u0641\u0627\u062A\u064A" />
<meta name="twitter:description" content="\u0623\u0641\u0636\u0644 \u0627\u0644\u0648\u0635\u0641\u0627\u062A \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0630\u0648\u0627\u0642" />
<meta name="twitter:image" content="${domain}/logo.png" />
</head>`);
  }
  const match = reqUrl.match(/^\/categories\/([^\/]+)\/([^\/?]+)/);
  if (match) {
    const categorySlug = decodeURIComponent(match[1]);
    const recipeSlug = decodeURIComponent(match[2]);
    try {
      let categoryId = null;
      const qCat = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "categories"), (0, import_firestore3.where)("slug", "==", categorySlug), (0, import_firestore3.limit)(1));
      const catSnap = await (0, import_firestore3.getDocs)(qCat);
      if (!catSnap.empty) {
        categoryId = catSnap.docs[0].id;
      }
      if (categoryId) {
        let recipe = null;
        const qRecipe = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "recipes"), (0, import_firestore3.where)("categoryId", "==", categoryId), (0, import_firestore3.where)("slug", "==", recipeSlug), (0, import_firestore3.where)("isPublished", "==", true), (0, import_firestore3.limit)(1));
        const recipeSnap = await (0, import_firestore3.getDocs)(qRecipe);
        if (!recipeSnap.empty) {
          recipe = recipeSnap.docs[0].data();
        } else {
          const qRecipePrev = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "recipes"), (0, import_firestore3.where)("categoryId", "==", categoryId), (0, import_firestore3.where)("previousSlugs", "array-contains", recipeSlug), (0, import_firestore3.where)("isPublished", "==", true), (0, import_firestore3.limit)(1));
          const prevSnap = await (0, import_firestore3.getDocs)(qRecipePrev);
          if (!prevSnap.empty) {
            recipe = prevSnap.docs[0].data();
          }
        }
        if (recipe) {
          const title = `${recipe.title} - \u0648\u0635\u0641\u0627\u062A\u064A`;
          const desc = recipe.shortDescription || recipe.description || "\u0648\u0635\u0641\u0629 \u0634\u0647\u064A\u0629";
          const img = recipe.mainImage ? recipe.mainImage.startsWith("http") ? recipe.mainImage : `${domain}${recipe.mainImage}` : `${domain}/logo.png`;
          const currentUrl = `${domain}/categories/${categorySlug}/${recipe.slug || recipeSlug}`;
          html = html.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
          html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${desc}" />`);
          html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${desc}" />`);
          html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${desc}" />`);
          html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`);
          html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${img}" />`);
          html = html.replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${currentUrl}" />`);
          html = html.replace(/<meta property="og:type" content=".*?"\s*\/>/, `<meta property="og:type" content="article" />`);
          html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
          html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${img}" />`);
          html = html.replace("</head>", `<link rel="canonical" href="${currentUrl}" />
</head>`);
        }
      }
    } catch (e) {
      console.error("Error generating dynamic SEO for recipe:", e);
    }
  } else {
    try {
      const settingsDoc = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "settings"), (0, import_firestore3.limit)(1)));
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data();
        if (settings.siteName) {
          html = html.replace(/<title>.*<\/title>/, `<title>${settings.siteName}</title>`);
          html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${settings.siteName}" />`);
          html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${settings.siteName}" />`);
        }
        if (settings.description) {
          html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${settings.description}" />`);
          html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${settings.description}" />`);
          html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${settings.description}" />`);
        }
        if (settings.logoUrl) {
          const imgUrl = settings.logoUrl.startsWith("http") ? settings.logoUrl : `${domain}${settings.logoUrl}`;
          html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${imgUrl}" />`);
          html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${imgUrl}" />`);
        }
      }
    } catch (e) {
      console.error("Dynamic settings SEO error:", e);
    }
  }
  return html;
}

// server.ts
var PORT = parseInt(process.env.PORT || "3000", 10);
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/@") || req.originalUrl.includes(".")) {
        return next();
      }
      try {
        let template = import_fs.default.readFileSync(import_path.default.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const html = await processDynamicSEO(req.originalUrl, req.get("host") || "localhost", template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        next(e);
      }
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app2.use(import_express2.default.static(distPath, { index: false }));
    app2.get("*", async (req, res) => {
      try {
        let html = import_fs.default.readFileSync(import_path.default.join(distPath, "index.html"), "utf8");
        html = await processDynamicSEO(req.originalUrl, req.get("host") || "localhost", html);
        res.send(html);
      } catch (err) {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      }
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
