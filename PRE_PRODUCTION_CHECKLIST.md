# 🚀 Sarathi Book - Pre-Production Checklist

Before publishing the application to production, run through this checklist to ensure stability, performance, and a premium user experience.

## 📱 1. PWA & Mobile Experience
- [ ] **Manifest Validation**: Verify `site.webmanifest` links correctly to all icons.
- [ ] **App Icons**: Ensure `favicon-192x192.png` and `favicon-512x512.png` are loaded correctly on Android/iOS home screens.
- [ ] **Viewport**: Check on actual mobile devices (iPhone & Android) for scaling issues.
- [ ] **Touch Targets**: Ensure buttons (Save, Calculate) are easily tappable (min 44px height).

## 🎨 2. UI/UX & Design
- [ ] **Logo & Branding**: efficient loading of the new "Blue SVG" logo and "Korkai" typography header.
- [ ] **Compact Mode**: Verify `TripForm`, `QuotationForm`, and `Profile` all use the new "Compact" styling (`h-10` inputs, small labels).
- [ ] **Dark Mode**: Toggle system dark mode and ensure no text becomes invisible (e.g., dark text on dark background).
- [ ] **Consistency**: Check that "SWA TAXI SERVICES" defaults are gone and placeholders show "Your Travels Name".

## 🛠️ 3. Functionality Testing
- [ ] **Trip Invoice**: precise calculation of KM * Rate + Batta + Toll.
- [ ] **PDF Generation**: Verify "Download PDF" generates a clean, stamped invoice.
- [ ] **Share Feature**: Test "Share on WhatsApp" button on mobile.
- [ ] **Google Maps**:
    - [ ] API Key restrictions (HTTP Referrer set in Google Cloud Console?).
    - [ ] Auto-complete working for Pickup/Drop locations.
    - [ ] Map picker loads correctly.
- [ ] **Local Storage**: Data persists after refreshing the page.

## 🧹 4. Data & Cleanup
- [ ] **Clear Defaults**: Ensure `SettingsContext.tsx` default values are empty (Verified!).
- [ ] **Console Utils**: Remove `console.log` statements from critical paths.
- [ ] **Unused Files**: Delete any temporary test components or unused assets from `src/assets`.

## 🔒 5. Security & Env
- [ ] **Environment Variables**: Ensure `.env` is NOT committed to Git.
- [ ] **API Keys**: Verify Google Maps Key and Supabase Keys are correct for production.
- [ ] **Supabase Policies**: (If used) Ensure RLS (Row Level Security) is enabled.

## ⚡ 6. Performance & Build
- [ ] **Build Test**: Run `npm run build` locally to check for compile errors.
- [ ] **Preview**: Run `npm run preview` to test the production build locally.
- [ ] **Lighthouse Score**: Run Chrome Audit -> Target 90+ on Performance & Accessibility.

## 🌍 7. SEO & Metadata
- [ ] **Title Tag**: "Sarathi Book - Your Digital Office on Car".
- [ ] **Meta Description**: "Professional Cab Management System for Drivers. Manage invoices, calculate fares, and track expenses."
- [ ] **OG Tags**: Open Graph images for link sharing (WhatsApp preview).

---
*Last Updated: 2025-12-25*
