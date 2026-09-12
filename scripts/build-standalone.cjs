// Generate a downloadable one-file build; optional media resolve upstream.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const html = source.replace('<head>', '<head>\n<base href="https://pigma005-dot.github.io/cube-challenge/">');
new vm.Script(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1]);
if (!process.argv[2]) throw new Error('Usage: node scripts/build-standalone.cjs OUTPUT.html [OUTPUT.html ...]');
for (const output of process.argv.slice(2)) {
  const target = path.resolve(output);
  fs.writeFileSync(target, html, 'utf8');
  console.log(target);
}
