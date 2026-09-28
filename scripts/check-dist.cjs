const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const scriptIdx = html.indexOf('crossorigin src=');
const bodyClose = html.indexOf('</body>');
console.log('React script at index:', scriptIdx);
console.log('</body> at index:', bodyClose);
console.log('Script BEFORE </body>?', scriptIdx > 0 && scriptIdx < bodyClose);
console.log('\n--- Last 600 chars of dist/index.html ---');
console.log(html.slice(-600));
