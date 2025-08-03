const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Android PWA icons...');

// Copy maskable icons to dist
const maskableIcons = [
  'pwa-192x192-maskable.png',
  'pwa-512x512-maskable.png'
];

for (const icon of maskableIcons) {
  const srcPath = path.join('public', icon);
  const destPath = path.join('dist', icon);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${icon} to dist folder`);
  } else {
    console.error(`❌ Source file not found: ${srcPath}`);
  }
}

// Update manifest with proper Android icons
const manifestPath = path.join('dist', 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
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
  console.log('✅ Updated manifest with Android maskable icons');
} else {
  console.error('❌ Manifest file not found');
}

console.log('🎉 Android PWA icons fixed!');
