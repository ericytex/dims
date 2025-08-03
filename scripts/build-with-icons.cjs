const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Building PWA with Android icons...');

// Run the normal build
execSync('npx vite build', { stdio: 'inherit' });

// Copy maskable icons to dist
console.log('📱 Copying maskable icons...');
execSync('cp public/pwa-*-maskable.png dist/', { stdio: 'inherit' });

// Update manifest with proper Android icons
console.log('📄 Updating manifest with maskable icons...');
const manifestPath = 'dist/manifest.webmanifest';
const manifest = {
  "name": "Inventory Management System",
  "short_name": "IMS",
  "description": "Decentralized Inventory Management System for Uganda",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "scope": "/",
  "lang": "en",
  "categories": ["business", "productivity", "utilities"],
  "icons": [
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "pwa-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "pwa-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ PWA build completed with Android icons!');
