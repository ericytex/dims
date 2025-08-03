const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');
  const maskableSvgBuffer = fs.readFileSync('public/icon-maskable.svg');
  
  const regularIcons = [
    { size: 144, name: 'pwa-144x144.png' },
    { size: 192, name: 'pwa-192x192.png' },
    { size: 384, name: 'pwa-384x384.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon.png' }
  ];

  const maskableIcons = [
    { size: 144, name: 'pwa-144x144-maskable.png' },
    { size: 192, name: 'pwa-192x192-maskable.png' },
    { size: 384, name: 'pwa-384x384-maskable.png' },
    { size: 512, name: 'pwa-512x512-maskable.png' }
  ];

  console.log('🎨 Generating regular PWA icons...');

  for (const { size, name } of regularIcons) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(`public/${name}`);
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('🎭 Generating maskable PWA icons...');

  for (const { size, name } of maskableIcons) {
    try {
      await sharp(maskableSvgBuffer)
        .resize(size, size)
        .png()
        .toFile(`public/${name}`);
      console.log(`✅ Generated ${name} (${size}x${size}) [MASKABLE]`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
