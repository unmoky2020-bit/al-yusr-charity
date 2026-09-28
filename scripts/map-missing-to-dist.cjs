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
  'hero-schoolbag-clothes.webp','hero-deco-van.webp','brand-volunteer-id.png','brand-app.jpg'
];
missing.forEach(name => {
  const stem = name.replace(/\.[^.]+$/, '');
  const matches = distAssets.filter(file => file.startsWith(stem) && file.endsWith(path.extname(name)));
  if (matches.length) {
    console.log(`${name}|${matches.join(',')}`);
  } else {
    console.log(`${name}|NO_MATCH`);
  }
});
