import { useEffect } from 'react';

interface SEOHeadProps {
    title: string;
    description?: string;
    schema?: any;
}

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, schema }) => {
    useEffect(() => {
        // Update Title
        const prevTitle = document.title;
        document.title = title.includes('Sarathi Book') ? title : `${title} | Sarathi Book`;

        // Update Description Meta Tag
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }

        const prevDescription = metaDescription.getAttribute('content');
        if (description) {
            metaDescription.setAttribute('content', description);
        }

        // Handle Open Graph Tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', title.includes('Sarathi Book') ? title : `${title} | Sarathi Book`);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && description) ogDesc.setAttribute('content', description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', window.location.href);

        // Handle Canonical Tag
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        const currentUrl = window.location.origin + window.location.pathname + window.location.search;
        linkCanonical.setAttribute('href', currentUrl);

        // Handle Dynamic Schema (JSON-LD)
        let schemaScript = document.getElementById('dynamic-seo-schema');
        if (schema) {
            if (!schemaScript) {
                schemaScript = document.createElement('script');
                schemaScript.id = 'dynamic-seo-schema';
                schemaScript.setAttribute('type', 'application/ld+json');
                document.head.appendChild(schemaScript);
            }
            schemaScript.textContent = JSON.stringify(schema);
        } else if (schemaScript) {
            schemaScript.remove();
        }

        return () => {
            document.title = prevTitle;
            if (prevDescription) {
                metaDescription?.setAttribute('content', prevDescription);
            }
            // We don't necessarily remove schema on unmount if it's the main page schema, 
            // but for dynamic route pages, it's safer to cleanup.
            if (schema) {
                document.getElementById('dynamic-seo-schema')?.remove();
            }
        };
    }, [title, description, schema]);

    return null;
};

export default SEOHead;
