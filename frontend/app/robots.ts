import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Prevent Google from indexing internal dashboards and APIs
      disallow: ['/admin/', '/vendor/', '/delivery/', '/rider-code/', '/api/', '/_next/'],
    },
    sitemap: 'https://foodzie.store/sitemap.xml',
  };
}
