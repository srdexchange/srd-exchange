import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nodeModulesDir = join(root, "node_modules");

const stubContent = `'use client';
// Patched by scripts/patch-antd-v5.mjs to avoid runtime crashes when antd does not expose unstableSetRender.
`;

function ensureHoistedStub() {
  const pkgDir = join(nodeModulesDir, "@ant-design/v5-patch-for-react-19");
  const esDir = join(pkgDir, "es");
  const libDir = join(pkgDir, "lib");

  if (!existsSync(pkgDir)) {
    mkdirSync(esDir, { recursive: true });
    mkdirSync(libDir, { recursive: true });

    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@ant-design/v5-patch-for-react-19",
        version: "1.0.3",
        main: "lib/index.js",
        module: "es/index.js",
      })
    );
  }

  writeFileSync(join(esDir, "index.js"), stubContent);
  writeFileSync(join(libDir, "index.js"), stubContent);
}

function patchPnpmStoreCopies() {
  const pnpmDir = join(nodeModulesDir, ".pnpm");
  if (!existsSync(pnpmDir)) {
    return 0;
  }

  let patchedFiles = 0;

  for (const entry of readdirSync(pnpmDir)) {
    if (!entry.startsWith("@ant-design+v5-patch-for-react-19@")) {
      continue;
    }

    const baseDir = join(
      pnpmDir,
      entry,
      "node_modules",
      "@ant-design",
      "v5-patch-for-react-19"
    );

    if (!existsSync(baseDir) || !statSync(baseDir).isDirectory()) {
      continue;
    }

    for (const relPath of ["es/index.js", "lib/index.js"]) {
      const filePath = join(baseDir, relPath);
      if (!existsSync(filePath)) {
        continue;
      }

      writeFileSync(filePath, stubContent);
      patchedFiles += 1;
    }
  }

  return patchedFiles;
}

ensureHoistedStub();
const patchedFiles = patchPnpmStoreCopies();
console.log(
  `✅ Patched @ant-design/v5-patch-for-react-19 compatibility stubs (${patchedFiles} pnpm store files)`
);
