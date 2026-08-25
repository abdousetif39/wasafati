import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'recipe';
  schema?: Record<string, any>;
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  schema,
  noindex = false,
}) => {
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'وصفاتي';
  const fullTitle = title ? `${title} - ${siteName}` : siteName;
  const defaultDescription = settings?.description || 'اكتشف أشهى الوصفات وألذ الأطباق';
  const desc = description || defaultDescription;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {!noindex && <meta name="robots" content="index,follow" />}

      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Schema.org */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    {settings?.adsEnabled && settings?.adsPublisherId && (
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsPublisherId}`} crossOrigin="anonymous"></script>
      )}
    </Helmet>
  );
};
