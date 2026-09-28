const fs = require('fs');
const path = require('path');
const glob = require('glob');
const root = process.cwd();
const files = glob.sync('src/**/*.{ts,tsx}');
const missing = [];
for (const file of files) {
  const fullPath = path.join(root, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const regex = /import\s+[^;]*?from\s+['\"]@\/assets\/([^'\"]+)['\"]/g;
  let m;
  while ((m = regex.exec(content))) {
    const asset = m[1];
    const assetPath = path.join(root, 'src', 'assets', asset);
    if (!fs.existsSync(assetPath)) {
      missing.push({ file, asset, assetPath });
    }
  }
}
if (missing.length === 0) {
  console.log('NO_MISSING_ASSETS');
} else {
  missing.forEach((item) => console.log(`${item.file}|${item.asset}|${item.assetPath}`));
  console.log(`MISSING_COUNT:${missing.length}`);
}
