# Sitemap Update Guide

You asked: *"is it not added to sitemap when user creates?"*

Currently, your `sitemap.xml` is a **static file** in the `public/` folder. It does not automatically know when a user searches for a route.

To make Google find these thousands of new `chennai-to-bangalore-taxi` pages, you need to generate a dynamic sitemap.

## Option 1: One-Time Generation Script (Recommended for now)

Since you are using Supabase, you can run a script to fetch all unique routes and append them to your sitemap.

### 1. Create a generator script (e.g., `scripts/generate-sitemap.js`)
*Note: This requires Node.js to run locally.*

```javascript
// scripts/generate-sitemap.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configure these
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const SITE_URL = 'https://sarathibook.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generate() {
    console.log("Fetching routes...");
    const { data: routes } = await supabase
        .from('route_searches')
        .select('pickup_location, drop_location')
        .limit(5000); // Adjust limit as needed

    const uniqueRoutes = new Set();
    const urls = [];

    routes.forEach(r => {
        if (!r.pickup_location || !r.drop_location) return;
        
        // Slugify logic matches your frontend
        const from = r.pickup_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        const to = r.drop_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        
        const key = `${from}-to-${to}`;
        if (uniqueRoutes.has(key)) return;
        uniqueRoutes.add(key);

        urls.push(`
    <url>
        <loc>${SITE_URL}/${from}-to-${to}-taxi</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`);
    });

    // Read existing static sitemap parts or just Template
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Static Pages -->
    <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
    <url><loc>${SITE_URL}/taxi-fare-calculator</loc><priority>0.9</priority></url>
    <url><loc>${SITE_URL}/routes</loc><priority>0.9</priority></url>
    
    <!-- Dynamic Routes (${urls.length}) -->
    ${urls.join('')}
</urlset>`;

    fs.writeFileSync('./public/sitemap.xml', sitemap);
    console.log(`Generated sitemap.xml with ${urls.length} dynamic routes!`);
}

generate();
```

## Option 2: Server-Side Sitemap (Advanced)
If you move to a framework like Next.js (SSR), you can generate this on-the-fly at `sarathibook.com/sitemap.xml`.
For your current Vite SPA, **Option 1** is the best way. You should run this script before every deployment.

## What we have done so far:
1.  **Enabled the URLs**: `sarathibook.com/chennai-to-bangalore-taxi` now works!
2.  **Updated Links**: Your "Routes Directory" now points to these SEO URLs.
3.  **SEO Tags**: These pages now have custom Title and Description tags.

The next step is to populate that sitemap so Google starts crawling them.
