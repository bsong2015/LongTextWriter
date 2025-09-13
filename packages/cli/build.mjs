
import esbuild from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PKG_JSON_PATH = path.resolve(__dirname, 'package.json');
const SRC_DIR = path.resolve(__dirname, 'src');
const ENTRY_POINT = path.resolve(SRC_DIR, 'index.ts');
const DIST_DIR = path.resolve(__dirname, 'dist');
const OUTFILE = path.resolve(DIST_DIR, 'index.js');

const UI_SRC_DIR = path.resolve(__dirname, '../web-ui/dist');
const UI_DEST_DIR = path.resolve(__dirname, 'public');

const LOCALES_SRC_DIR = path.resolve(__dirname, '../../locales');
const LOCALES_DEST_DIR = path.resolve(DIST_DIR, 'locales');

// --- Helper Functions ---

async function clean() {
  console.log(`Cleaning directories: ${DIST_DIR} and ${UI_DEST_DIR}`);
  await Promise.all([
    fs.rm(DIST_DIR, { recursive: true, force: true }),
    fs.rm(UI_DEST_DIR, { recursive: true, force: true }),
  ]);
  console.log('Directories cleaned.');
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function copyAssets() {
  console.log(`Copying UI assets from ${UI_SRC_DIR} to ${UI_DEST_DIR}`);
  await copyDir(UI_SRC_DIR, UI_DEST_DIR);
  console.log('UI assets copied.');

  console.log(`Copying locales from ${LOCALES_SRC_DIR} to ${LOCALES_DEST_DIR}`);
  await copyDir(LOCALES_SRC_DIR, LOCALES_DEST_DIR);
  console.log('Locales copied.');
}

async function build() {
  console.log('Starting esbuild process...');
  const packageJson = JSON.parse(await fs.readFile(PKG_JSON_PATH, 'utf-8'));
  const external = Object.keys(packageJson.dependencies || {}).filter(dep => dep !== '@gendoc/shared');

  await esbuild.build({
    entryPoints: [ENTRY_POINT],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: OUTFILE,
    external: external,
    banner: {
      js: '#!/usr/bin/env node',
    },
    logLevel: 'info',
  });
  console.log('esbuild process completed.');
}

// --- Main Execution ---

async function main() {
  try {
    await clean();
    await copyAssets();
    await build();
    console.log('Build successful!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
