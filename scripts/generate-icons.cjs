const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');
  
  const sizes = [
    { size: 192, name: 'pwa-192x192.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon.png' }
  ];

  console.log('🎨 Generating PWA icons...');

  for (const { size, name } of sizes) {
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

  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
