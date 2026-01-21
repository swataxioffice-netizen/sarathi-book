import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to manually parse .env since we might not have dotenv in dependencies
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '..', '.env');
        console.log("Loading .env from:", envPath);
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf-8');
            // Remove BOM if present
            if (envContent.charCodeAt(0) === 0xFEFF) {
                envContent = envContent.slice(1);
            }

            const envVars = {};
            // Split by newline (handles \n and \r\n)
            envContent.split(/\r?\n/).forEach(line => {
                const trimmedLine = line.trim();
                // Skip comments and empty lines
                if (!trimmedLine || trimmedLine.startsWith('#')) return;

                const match = trimmedLine.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    envVars[key] = value;
                }
            });
            console.log("Loaded keys:", Object.keys(envVars));
            return envVars;
        } else {
            console.warn(".env file not found at:", envPath);
        }
    } catch (e) {
        console.warn("Could not load .env file", e);
    }
    return process.env;
}

const env = loadEnv();

// Configuration
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://sarathibook.com';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in .env file");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generate() {
    console.log("Fetching routes from Supabase...");

    // Fetch distinct routes (simulated distinct by fetching recent unique)
    // We fetch a larger batch to get good coverage
    const { data: routes, error } = await supabase
        .from('route_searches')
        .select('pickup_location, drop_location')
        .order('created_at', { ascending: false })
        .limit(5000);

    if (error) {
        console.error("Error fetching routes:", error);
        return;
    }

    console.log(`Fetched ${routes.length} raw route entries.`);

    const uniqueRoutes = new Set();
    const urls = [];

    routes.forEach(r => {
        if (!r.pickup_location || !r.drop_location) return;

        // Slugify logic must match frontend (trending routes / directory)
        const from = r.pickup_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        const to = r.drop_location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');

        const key = `${from}-to-${to}`;

        // Avoid duplicates
        if (uniqueRoutes.has(key)) return;
        uniqueRoutes.add(key);

        urls.push(`
    <url>
        <loc>${SITE_URL}/${from}-to-${to}-taxi</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`);
    });

    console.log(`Identified ${uniqueRoutes.size} unique SEO routes.`);

    // Static Pages (Add more as needed)
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

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Static Pages -->
    ${staticUrls}
    
    <!-- Dynamic Route Pages -->
    ${urls.join('')}
</urlset>`;

    const outputPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemapContent);

    console.log(`✅ Successfully generated sitemap.xml at ${outputPath}`);
    console.log(`Total URLs: ${staticPages.length + uniqueRoutes.size}`);
}

generate().catch(err => console.error("Script execution failed:", err));
