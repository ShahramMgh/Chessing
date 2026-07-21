#!/usr/bin/env node
/**
 * Copies the single-threaded "lite" Stockfish 18 build out of the installed
 * `stockfish` npm package and into the client's public/ folder so it can be
 * loaded directly as a Web Worker at runtime (`/stockfish/stockfish.js`).
 *
 * We use the *lite-single* build on purpose:
 *   - "single"  -> single-threaded, so we do NOT need SharedArrayBuffer and the
 *                  associated COOP/COEP cross-origin-isolation headers.
 *   - "lite"    -> smaller NNUE network (~7MB instead of ~113MB).
 *
 * Run automatically after `npm install` (see client/package.json postinstall)
 * or manually via `npm run setup:stockfish` from the repo root.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// The `stockfish` package is a dependency of the client workspace.
const CANDIDATE_DIRS = [
  path.join(ROOT, 'client', 'node_modules', 'stockfish', 'src'),
  path.join(ROOT, 'client', 'node_modules', 'stockfish', 'bin'),
  path.join(ROOT, 'node_modules', 'stockfish', 'src'),
  path.join(ROOT, 'node_modules', 'stockfish', 'bin'),
];

const OUT_DIR = path.join(ROOT, 'client', 'public', 'stockfish');

function findStockfishDir() {
  for (const dir of CANDIDATE_DIRS) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function main() {
  const srcDir = findStockfishDir();
  if (!srcDir) {
    console.error(
      '[setup:stockfish] Could not find the stockfish package. ' +
        'Did you run `npm install` inside client/?'
    );
    process.exit(1);
  }

  const files = fs.readdirSync(srcDir);
  // Prefer the lite single-threaded build.
  const jsFile = files.find((f) => f === 'stockfish-18-lite-single.js') ||
    files.find((f) => /lite-single\.js$/.test(f)) ||
    files.find((f) => /single\.js$/.test(f));
  const wasmFile = files.find((f) => f === 'stockfish-18-lite-single.wasm') ||
    files.find((f) => /lite-single\.wasm$/.test(f)) ||
    files.find((f) => /single\.wasm$/.test(f));

  if (!jsFile || !wasmFile) {
    console.error(
      `[setup:stockfish] Could not locate a single-threaded lite build in ${srcDir}.\n` +
        `Found: ${files.join(', ')}`
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // The emscripten loader derives its .wasm URL from its OWN location by
  // replacing `.js` -> `.wasm` (there is no hard-coded version string inside).
  // So we copy both files to stable, matching names: the app always loads
  // `/stockfish/stockfish.js`, which then resolves `/stockfish/stockfish.wasm`.
  // This keeps the app code independent of the exact Stockfish version.
  fs.copyFileSync(path.join(srcDir, jsFile), path.join(OUT_DIR, 'stockfish.js'));
  fs.copyFileSync(path.join(srcDir, wasmFile), path.join(OUT_DIR, 'stockfish.wasm'));
  console.log(`[setup:stockfish] ${jsFile} -> stockfish.js`);
  console.log(`[setup:stockfish] ${wasmFile} -> stockfish.wasm`);

  console.log(`[setup:stockfish] done. Files in ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
