import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { audit } from './audit.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'model', 'er.mmd');
const verifyOnly = process.argv.slice(2).includes('--check');

function run() {
  if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node tools/render.js [--check]');
  const result = audit(readFileSync(path.join(root, 'spec.md'), 'utf8'), readFileSync(source, 'utf8'));
  if (!result.ok) throw new Error(`ER audit failed:\n${result.errors.join('\n')}`);
  const require = createRequire(import.meta.url);
  const cliPackage = path.resolve(path.dirname(require.resolve('@mermaid-js/mermaid-cli')), '..', 'package.json');
  const cli = path.resolve(path.dirname(cliPackage), JSON.parse(readFileSync(cliPackage, 'utf8')).bin.mmdc);
  const temp = mkdtempSync(path.join(tmpdir(), 'library-er-render-'));
  try {
    const outputs = [];
    for (const extension of ['svg', 'png']) {
      const output = path.join(temp, `er.${extension}`);
      const child = spawnSync(process.execPath, [cli, '-i', source, '-o', output,
        '-c', path.join(root, 'tools', 'mermaid-config.json'), '-b', 'white', '--size', '3000', '-s', '2'], {
        cwd: root,
        env: { ...process.env, PUPPETEER_CACHE_DIR: path.join(root, '.cache', 'puppeteer') },
        encoding: 'utf8', timeout: 120000,
      });
      if (child.error || child.status !== 0) throw new Error(child.error?.message ?? child.stderr ?? 'Mermaid CLI failed');
      const bytes = readFileSync(output);
      if (extension === 'svg') {
        const svg = bytes.toString('utf8');
        if (!svg.includes('<svg') || !svg.includes('</svg>')) throw new Error('Invalid SVG output');
        const modelText = readFileSync(source, 'utf8');
        const names = [...modelText.matchAll(/^\s*(\w+)\s*\{/gm)].map(match => match[1]);
        const attributes = [...modelText.matchAll(/^\s*(uuid|string|int|datetime)\s+(\w+)/gm)];
        for (const token of [...names, ...attributes.flatMap(match => [match[1], match[2]]), 'PK', 'FK', 'UK']) {
          if (!svg.includes(token)) throw new Error(`SVG missing model token ${token}`);
        }
      } else if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error('Invalid PNG output');
      }
      outputs.push({ target: path.join(root, 'model', `er.${extension}`), bytes });
    }
    for (const { target, bytes } of outputs) {
      const same = existsSync(target) && readFileSync(target).equals(bytes);
      if (verifyOnly && !same) throw new Error(`Stale or missing ${path.relative(root, target)}; run npm run render`);
    }
    if (!verifyOnly) for (const { target, bytes } of outputs) {
      if (!existsSync(target) || !readFileSync(target).equals(bytes)) writeFileSync(target, bytes);
    }
    console.log(verifyOnly ? 'PASS: SVG/PNG match fresh Mermaid rendering byte for byte.' : 'PASS: model/er.svg and model/er.png generated from audited model/er.mmd.');
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

try { run(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
