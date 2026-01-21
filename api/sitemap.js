import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    const SITE_URL = 'https://sarathibook.com';

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return response.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        // Fetch valid routes
        const { data: routes, error } = await supabase
            .from('route_searches')
            .select('pickup_location, drop_location')
            .order('created_at', { ascending: false })
            .limit(5000);

        if (error) throw error;

        const uniqueRoutes = new Set();
        const routeUrls = [];

        routes.forEach(r => {
            if (!r.pickup_location || !r.drop_location) return;

            // Slugify logic
            const from = r.pickup_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
            const to = r.drop_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
            const key = `${from}-to-${to}`;

            if (uniqueRoutes.has(key)) return;
            uniqueRoutes.add(key);

            routeUrls.push(`
    <url>
        <loc>${SITE_URL}/${from}-to-${to}-taxi</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`);
        });

        const staticPages = [
            '',
            '/taxi-fare-calculator',
            '/routes',
            '/trending',
            '/tariff',
            '/about',
            '/contact'
        ];

        const staticUrls = staticPages.map(page => `
    <url>
        <loc>${SITE_URL}${page}</loc>
        <changefreq>daily</changefreq>
        <priority>${page === '' ? '1.0' : '0.9'}</priority>
    </url>`).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Static Pages -->
    ${staticUrls}
    
    <!-- Dynamic Route Pages (${uniqueRoutes.size}) -->
    ${routeUrls.join('')}
</urlset>`;

        // Set Headers for XML and Caching
        response.setHeader('Content-Type', 'text/xml');
        // Cache on Vercel Edge Network for 1 hour (3600s), execute on server again after that
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return response.status(200).send(sitemap);

    } catch (e) {
        console.error("Sitemap generation error:", e);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}
