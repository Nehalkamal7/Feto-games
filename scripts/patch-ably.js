const fs = require('fs');
const path = require('path');

const possiblePaths = [
  path.resolve(__dirname, '../node_modules/ably/build/ably.js'),
  path.resolve(__dirname, '../apps/web/node_modules/ably/build/ably.js'),
  path.resolve(process.cwd(), 'node_modules/ably/build/ably.js')
];

for (const targetPath of possiblePaths) {
  if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');
    if (content.includes('var __super = (...args) => {')) {
      content = content.replace(
        /var __super = \(\.\.\.args\) => \{\s*super\(\.\.\.args\);\s*\};/g,
        'super(typeof messageOrValues === "object" ? messageOrValues?.message : messageOrValues); var __super = () => {};'
      );
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`✓ Successfully patched ${targetPath} for Next.js SWC compatibility.`);
    }
  }
}
