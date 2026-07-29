#!/usr/bin/env node
// Fails if any file under packages/ imports the 'vscode' module.
//
// The core engine must be headless so it can run as a SaaS service, not only
// inside the VS Code extension host. Editor-only code belongs in the VS Code
// client, never in packages/. See docs/specs/002-headless-extraction.md and
// CLAUDE.md (load-bearing decision: the deterministic core leaves VS Code).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGES = fileURLToPath(new URL('../packages', import.meta.url));
const PATTERN = /(?:from|require\()\s*['"]vscode['"]/;

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

const offenders = walk(PACKAGES).filter((file) => PATTERN.test(readFileSync(file, 'utf8')));

if (offenders.length > 0) {
  console.error('FAIL: vscode imports found in core packages:');
  for (const file of offenders) console.error('  ' + file);
  console.error('\nThe engine must be headless. Put editor-only code in the VS Code client.');
  process.exit(1);
}

console.log('OK: no vscode imports in packages/');
