const fs = require('fs');
const path = require('path');

// This script is a no-op for Vercel (Vercel static-build promotes build/* to output root automatically).
// It only ensures that favicon.ico and manifest.json exist (sanity check) after build.

const buildDir = path.join(__dirname, '..', 'frontend', 'build');
const rootOut = path.join(__dirname, '..');

function ensure(file) {
  const src = path.join(buildDir, file);
  if (fs.existsSync(src)) {
    const dest = path.join(rootOut, file);
    try {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} to root output.`);
    } catch (e) {
      console.warn(`Could not copy ${file}:`, e.message);
    }
  } else {
    console.warn(`File not found in build: ${file}`);
  }
}

['favicon.ico', 'manifest.json'].forEach(ensure);

// Fallback: se favicon não copiado mas existe em public e não em root, copiar de public
const publicDir = path.join(__dirname, '..', 'frontend', 'public');
const rootFavicon = path.join(rootOut, 'favicon.ico');
if (!fs.existsSync(rootFavicon)) {
  const pubFav = path.join(publicDir, 'favicon.ico');
  if (fs.existsSync(pubFav)) {
    try {
      fs.copyFileSync(pubFav, rootFavicon);
      console.log('Copied fallback favicon.ico from public to root.');
    } catch(e) {
      console.warn('Failed fallback copy favicon:', e.message);
    }
  }
}
