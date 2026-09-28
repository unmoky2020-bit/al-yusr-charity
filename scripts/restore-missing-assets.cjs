const fs = require('fs');
const path = require('path');
const root = process.cwd();
const distAssets = fs.readdirSync(path.join(root, 'dist', 'assets'));
const missing = [
  'icon-vet.png','icon-camera.png','icon-truck.png','icon-receipt.png',
  '3d-tree.png','3d-heart.png','3d-hand.png','trust-hero.jpg','trust-transparency.jpg','qurbani-meat-trays.jpg',
  'season-winter.jpg','season-ramadan.jpg','season-dhulhijjah.jpg','season-qurbani.jpg','season-school.jpg',
  'brand-donation-can.jpg','brand-van.jpg','hero-carton-opened.webp','hero-meat-trays.webp','hero-meat-chicken-platter.webp','hero-table-carton.jpg',
  'hero-happy-saidi-family.jpg','hero-bg-luxury.jpg','icon-cow-card.png','icon-sheep-card.png','qurbani-pricing-2026.png','icon-shares-card.png',
  'brand-van.png','hero-schoolbag-clothes.png','axis-water-drop.png','hero-happy-family-end.webp','axis-edu-books.png','hero-deco-bread.webp',
  'hero-meat-chicken-platter.webp','hero-meat-trays.webp','hero-schoolbag-clothes.webp','hero-deco-van.webp','brand-volunteer-id.png','brand-app.jpg'
];
const restored = [];
const notFound = [];
for (const asset of missing) {
  const stem = asset.replace(/\.[^.]+$/, '');
  const ext = path.extname(asset);
  const candidate = distAssets.find(f => f.startsWith(stem) && f.endsWith(ext));
  if (candidate) {
    const src = path.join(root, 'dist', 'assets', candidate);
    const dest = path.join(root, 'src', 'assets', asset);
    fs.copyFileSync(src, dest);
    restored.push(`${asset} <= ${candidate}`);
  } else {
    notFound.push(asset);
  }
}
console.log('restored:' + restored.length);
restored.forEach(x => console.log(x));
if (notFound.length) {
  console.log('not found:' + notFound.length);
  notFound.forEach(x => console.log(x));
}
