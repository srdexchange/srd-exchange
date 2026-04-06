/**
 * Patches @rango-dev/widget-embedded to fix the "o.config is undefined" crash.
 *
 * Root cause: npm installs duplicate copies of @rango-dev/wallets-core under
 * each provider package. The widget uses `instanceof Provider` to check if a
 * wallet provider is the new Hub format, but instanceof fails across different
 * module copies. This patch replaces all instanceof checks with duck-type
 * checks (checking .id instead, which exists on all Provider instances).
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', '@rango-dev', 'widget-embedded', 'dist', 'index.js');

if (!fs.existsSync(file)) {
  console.log('[patch-rango] Widget not installed yet, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(file, 'utf8');
let patchCount = 0;

// Match any: X instanceof Y?X.id:X.config.type
// Replace with: X.id?X.id:X.config.type
content = content.replace(
  /(\w+) instanceof \w+\?\1\.id:\1\.config\.type/g,
  (match, v) => { patchCount++; return `${v}.id?${v}.id:${v}.config.type`; }
);

// Match any: X instanceof Y?X.id===Z:X.config.type===Z
// Replace with: X.id?X.id===Z:X.config.type===Z
content = content.replace(
  /(\w+) instanceof \w+\?\1\.id===(\w+):\1\.config\.type===\2/g,
  (match, v, n) => { patchCount++; return `${v}.id?${v}.id===${n}:${v}.config.type===${n}`; }
);

if (patchCount === 0) {
  console.log('[patch-rango] No patterns found to patch (already patched or version changed).');
} else {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[patch-rango] Patched ${patchCount} instance(s) successfully.`);
}
