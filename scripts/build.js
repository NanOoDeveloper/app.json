const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'src'), { recursive: true });
for (const file of ['index.html', 'src/main.js', 'src/styles.css']) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}
console.log('Built static site to dist/');
