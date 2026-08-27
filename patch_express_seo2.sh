#!/bin/bash
sed -i 's/<meta property="og:type" content="website">/<meta property="og:type" content="website">\n    <meta property="og:site_name" content="وصفاتي">\n    <meta property="og:locale" content="ar_DZ">/g' src/server/seo.ts
