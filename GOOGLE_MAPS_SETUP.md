# Google Maps Integration Guide

## 🗺️ Setup Instructions

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name it: "Sarathi Book" or similar
   - Click "Create"

3. **Enable Required APIs**
   Navigate to "APIs & Services" → "Library" and enable:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Distance Matrix API
   - ✅ Directions API
   - ✅ Geocoding API

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

5. **Restrict API Key (IMPORTANT for security)**
   - Click on your API key to edit
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add referrers:
       ```
       http://localhost:5174/*
       http://localhost:5173/*
       https://yourdomain.com/*
       https://www.yourdomain.com/*
       ```
   - Under "API restrictions":
     - Select "Restrict key"
     - Select only the 5 APIs listed above
   - Click "Save"

### Step 2: Add API Key to Your Project

1. **Create `.env` file** in the root directory (d:\websites\cab driver\)
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

2. **Replace `YOUR_ACTUAL_API_KEY_HERE`** with your actual API key from step 1

3. **Restart the dev server** after adding the key:
   ```bash
   npm run dev
   ```

### Step 3: Integration is Ready!

The following files have been created:
- ✅ `src/utils/googleMaps.ts` - Google Maps utility functions
- ✅ `src/components/MapPicker.tsx` - Interactive map component

## 🎯 How to Use

### In Calculator Component

Add a button to open the map picker:

```tsx
import { useState } from 'react';
import MapPicker from './MapPicker';

const [showMap, setShowMap] = useState(false);
const [pickup, setPickup] = useState('');
const [drop, setDrop] = useState('');
const [distance, setDistance] = useState(0);

// Add button
<button 
  onClick={() => setShowMap(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
>
  📍 Select on Map
</button>

// Add map picker
{showMap && (
  <MapPicker
    onLocationSelect={(pickup, drop, distance) => {
      setPickup(pickup);
      setDrop(drop);
      setDistance(distance);
    }}
    onClose={() => setShowMap(false)}
  />
)}
```

## 🎨 Features Included

### Visual Elements
- 🟢 **Green Pin** - Pickup location
- 🔴 **Red Pin** - Drop location
- 🔵 **Blue Route** - Driving directions
- 📏 **Distance Display** - Automatic calculation

### User Interactions
- ✅ Tap map to set pickup/drop
- ✅ Draggable markers
- ✅ Current location detection
- ✅ Address reverse geocoding
- ✅ Real-time distance calculation
- ✅ Visual route display

### Mobile Optimized
- ✅ Full-screen map interface
- ✅ Touch-friendly controls
- ✅ Responsive design
- ✅ Clean, modern UI

## 💰 Pricing (Google Maps)

### Free Tier
- **$200 free credit** per month
- Covers approximately:
  - 40,000 Distance Matrix requests
  - 28,000 Directions requests
  - 100,000 Geocoding requests

### After Free Tier
- Distance Matrix: $0.005 per request
- Directions: $0.005 per request
- Maps JavaScript API: $0.007 per load

**For most small businesses, the free tier is sufficient!**

## 🔒 Security Best Practices

1. **Never commit `.env` file** to Git (already in .gitignore)
2. **Always restrict API key** to your domains
3. **Enable only required APIs**
4. **Monitor usage** in Google Cloud Console
5. **Set billing alerts** to avoid unexpected charges

## 🐛 Troubleshooting

### "Failed to load Google Maps"
- ✅ Check if API key is added to `.env`
- ✅ Verify all 5 APIs are enabled
- ✅ Check browser console for specific errors
- ✅ Ensure dev server was restarted after adding key

### "This page can't load Google Maps correctly"
- ✅ API key restrictions might be too strict
- ✅ Temporarily remove restrictions to test
- ✅ Add correct domain to HTTP referrers

### Map shows but no distance calculated
- ✅ Ensure Distance Matrix API is enabled
- ✅ Check browser console for API errors
- ✅ Verify billing is enabled (required for Distance Matrix)

## 📱 Next Steps

1. **Get your API key** (follow Step 1 above)
2. **Add to `.env` file** (follow Step 2 above)
3. **Integrate into Calculator** - I can help with this!
4. **Test the functionality**
5. **Deploy to production**

## 🚀 Ready to Integrate?

Once you have your API key, let me know and I'll:
1. Update the Calculator component
2. Add the map picker button
3. Wire up the distance calculation
4. Test everything end-to-end

Just say "I have the API key" and share it with me!
