import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { root, checkSources } from './check-sequences.mjs';
import { sha256, inspectPng, expectedLabels, artifactDifferences, requireEqualBytes } from './render-validation.mjs';

const tools = path.dirname(fileURLToPath(import.meta.url));
const diagramDir = path.join(root, 'lab3/diagrams');
const configPath = path.join(tools, 'mermaid-config.json');
const manifestPath = path.join(diagramDir, 'render-manifest.json');
const viewport = { width: 1600, height: 1000, deviceScaleFactor: 2 };
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const args = process.argv.slice(2);
if (args.some(x => !['--check', '--syntax-only'].includes(x)) || new Set(args).size !== args.length || args.length > 1) {
  console.error('Usage: node lab3/tools/render-sequences.mjs [--check | --syntax-only]');
  process.exit(1);
}
const check = args.includes('--check'), syntaxOnly = args.includes('--syntax-only');
const metadata = {
  schema: 1, cli: '12.0.0', mermaid: '12.2.0', puppeteer: '25.13.0',
  viewport, background: 'white', fontEmbed: false,
};

function installed(name, version) {
  const actual = readJson(path.join(root, 'node_modules', name, 'package.json')).version;
  if (actual !== version) throw new Error(name + ': expected ' + version + ', installed ' + actual + '. Run npm ci.');
}
function verifyInventory(files) {
  for (const format of ['svg', 'png']) {
    const dir = path.join(diagramDir, format);
    const expected = files.map(file => path.basename(file, '.mmd') + '.' + format);
    const actual = existsSync(dir) ? readdirSync(dir).filter(x => x.endsWith('.' + format)) : [];
    const diff = artifactDifferences(expected, actual);
    if (diff.missing.length || diff.extra.length) {
      throw new Error(format + ' inventory: missing [' + diff.missing.join(', ') + '], extra [' + diff.extra.join(', ') + ']');
    }
  }
}

async function inspectImages(page, source, svg, png) {
  const pngSize = inspectPng(png);
  const result = await page.evaluate(async ({ xml, labels, pngBase64 }) => {
    const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Malformed SVG XML');
    const root = doc.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('Not SVG');
    if (root.querySelector('script')) throw new Error('Unexpected script in SVG');
    document.body.replaceChildren(document.importNode(root, true));
    document.body.style.margin = '0';
    const svg = document.querySelector('svg');
    await document.fonts.ready;
    const vb = svg.viewBox.baseVal;
    if (!(vb.width > 0 && vb.height > 0)) throw new Error('Empty SVG viewBox');
    // Mermaid hyphenates a long token at a line break (e.g. da- / ta).
    const norm = text => text.replace(/-\s+/g, '').replace(/\s|\u200b|\u00ad/g, '');
    const textContent = norm([...svg.querySelectorAll('text,foreignObject')].map(e => e.textContent).join(' '));
    const missing = labels.filter(label => !textContent.includes(norm(label)));
    if (missing.length) throw new Error('Missing SVG text: ' + missing.slice(0, 4).join(' / '));
    if (!/[іїєґІЇЄҐ]/.test(textContent)) throw new Error('Ukrainian text missing');
    const bounds = svg.getBoundingClientRect(), tolerance = 4;
    const clipped = [];
    const textBoxes = [];
    for (const el of svg.querySelectorAll('text,line,path,polyline,rect,polygon')) {
      if (el.closest('defs')) continue;
      const box = el.getBoundingClientRect();
      if (!box.width && !box.height) continue;
      if (box.left < bounds.left - tolerance || box.top < bounds.top - tolerance ||
          box.right > bounds.right + tolerance || box.bottom > bounds.bottom + tolerance) {
        clipped.push((el.textContent || el.tagName).slice(0, 100));
      }
      if (el.tagName === 'text' && el.textContent.trim() && box.width && box.height) {
        textBoxes.push({ text: el.textContent.trim(), x: box.left, y: box.top, w: box.width, h: box.height });
      }
    }
    const overlaps = [];
    for (let i = 0; i < textBoxes.length; i++) for (let j = i + 1; j < textBoxes.length; j++) {
      const a = textBoxes[i], b = textBoxes[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (w > 5 && h > 5 && w * h > 0.2 * Math.min(a.w * a.h, b.w * b.h)) {
        overlaps.push(a.text.slice(0, 65) + ' / ' + b.text.slice(0, 65));
      }
    }
    const img = new Image(); img.src = 'data:image/png;base64,' + pngBase64; await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('PNG cannot be decoded');
    return {
      svg: { width: vb.width, height: vb.height }, png: { width: img.naturalWidth, height: img.naturalHeight },
      labelsChecked: labels.length, textElements: textBoxes.length, clipped, overlaps,
    };
  }, { xml: svg.toString('utf8'), labels: expectedLabels(source), pngBase64: png.toString('base64') });
  if (result.png.width !== pngSize.width || result.png.height !== pngSize.height) throw new Error('PNG dimensions disagree');
  if (result.clipped.length) throw new Error('Geometry outside SVG viewBox: ' + result.clipped.slice(0, 3).join(' / '));
  if (result.overlaps.length) throw new Error('Potential critical text overlaps: ' + result.overlaps.slice(0, 3).join(' / '));
  return result;
}

async function run() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor !== 22 || Number(process.versions.node.split('.')[1]) < 13) throw new Error('Use Node.js >=22.13 <23');
  const sources = checkSources().files;
  if (new Set(sources.map(x => path.basename(x))).size !== sources.length) throw new Error('Duplicate source basenames');
  for (const [name, version] of [['@mermaid-js/mermaid-cli', metadata.cli], ['mermaid', metadata.mermaid], ['puppeteer', metadata.puppeteer]]) installed(name, version);
  // Set before importing Puppeteer: never fall back to an unpinned system browser.
  process.env.PUPPETEER_CACHE_DIR = path.join(root, '.cache/puppeteer');
  const { default: puppeteer } = await import('puppeteer');
  const { renderMermaid } = await import('@mermaid-js/mermaid-cli');
  const config = readJson(configPath);
  const toolHashes = Object.fromEntries(['render-sequences.mjs', 'render-validation.mjs', 'check-sequences.mjs'].map(name =>
    [name, sha256(readFileSync(path.join(tools, name)))]));
  const inputs = {
    config: sha256(readFileSync(configPath)), tools: toolHashes,
    lock: sha256(readFileSync(path.join(root, 'package-lock.json'))),
    sources: Object.fromEntries(sources.map(file => [file, sha256(readFileSync(path.join(root, file)))])),
  };
  let stored;
  if (check) {
    verifyInventory(sources);
    if (!existsSync(manifestPath)) throw new Error('Missing render-manifest.json. Run the renderer.');
    stored = readJson(manifestPath);
    for (const file of sources) {
      if (stored.inputs?.sources?.[file] !== inputs.sources[file]) throw new Error('Stale source: ' + file);
    }
    if (JSON.stringify(stored.inputs) !== JSON.stringify(inputs)) throw new Error('Stale config/tool/lock or source inventory. Re-render.');
    for (const file of sources) {
      const base = path.basename(file, '.mmd');
      for (const format of ['svg', 'png']) {
        const target = path.join(diagramDir, format, base + '.' + format);
        try {
          const bytes = readFileSync(target);
          if (sha256(bytes) !== stored.diagrams?.[base]?.[format + 'Sha256']) throw new Error('Artifact hash mismatch');
          if (format === 'png') inspectPng(bytes);
        } catch (error) { throw new Error(path.relative(root, target) + ': ' + error.message); }
      }
    }
  }
  const browser = await puppeteer.launch({ headless: true, args: ['--disable-gpu', '--no-first-run'], timeout: 60000 });
  const temporaryRoot = path.resolve(tmpdir());
  const temporary = syntaxOnly ? null : mkdtempSync(path.join(temporaryRoot, 'lab3-sequences-'));
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto('about:blank');
    await page.addScriptTag({ path: path.join(root, 'node_modules/mermaid/dist/mermaid.min.js') });
    const environment = {
      node: process.versions.node, platform: process.platform, arch: process.arch,
      browser: await browser.version(), fontFamily: config.fontFamily,
    };
    const manifest = { ...metadata, environment, inputs, diagrams: {} };
    const pending = [], failures = [];
    for (const [index, file] of sources.entries()) {
      const base = path.basename(file, '.mmd'), source = readFileSync(path.join(root, file), 'utf8');
      try {
        if (sha256(Buffer.from(source)) !== inputs.sources[file]) throw new Error('Source changed during rendering');
        await page.evaluate(async ({ source, config }) => {
          mermaid.initialize({ ...config, startOnLoad: false });
          const parsed = await mermaid.parse(source);
          if (parsed.diagramType !== 'sequence') throw new Error('Not a sequence diagram');
        }, { source, config });
        if (!syntaxOnly) {
          const options = { viewport, backgroundColor: 'white', mermaidConfig: config, fontEmbed: false, svgId: 'seq-' + base };
          const svg = Buffer.from((await renderMermaid(browser, source, 'svg', options)).data);
          const png = Buffer.from((await renderMermaid(browser, source, 'png', options)).data);
          const geometry = await inspectImages(page, source, svg, png);
          for (const [format, bytes] of [['svg', svg], ['png', png]]) {
            const target = path.join(diagramDir, format, base + '.' + format);
            writeFileSync(path.join(temporary, base + '.' + format), bytes);
            if (check) {
              const old = readFileSync(target);
              requireEqualBytes(old, bytes, path.relative(root, target));
            }
            pending.push({ target, bytes });
          }
          manifest.diagrams[base] = { source: file, svgSha256: sha256(svg), pngSha256: sha256(png), ...geometry };
        }
        console.log('PASS ' + (index + 1) + '/' + sources.length + ' ' + path.basename(file) + (syntaxOnly ? ' syntax' : ' SVG/PNG, text and geometry'));
      } catch (error) {
        const message = file + ': ' + error.message; failures.push(message); console.error('FAIL ' + message);
      }
    }
    if (failures.length) throw new Error(failures.length + ' diagram(s) failed; stored outputs were not changed.');
    if (syntaxOnly) { console.log('PASS: ' + sources.length + '/' + sources.length + ' Mermaid syntax.'); return; }
    if (sha256(readFileSync(configPath)) !== inputs.config ||
        sha256(readFileSync(path.join(root, 'package-lock.json'))) !== inputs.lock ||
        Object.entries(toolHashes).some(([name, hash]) => sha256(readFileSync(path.join(tools, name))) !== hash) ||
        sources.some(file => sha256(readFileSync(path.join(root, file))) !== inputs.sources[file])) {
      throw new Error('Inputs changed during rendering; stored outputs were not changed.');
    }
    const serialized = JSON.stringify(manifest, null, 2) + '\n';
    if (check) {
      requireEqualBytes(readFileSync(manifestPath), Buffer.from(serialized), 'render manifest/environment');
      console.log('PASS: ' + sources.length + ' SVG + ' + sources.length + ' PNG match fresh pinned rendering byte for byte.');
    } else {
      // Never delete unexpected user files; reject extra artifacts before committing a generation.
      for (const format of ['svg', 'png']) {
        const dir = path.join(diagramDir, format);
        if (existsSync(dir)) {
          const diff = artifactDifferences(sources.map(file => path.basename(file, '.mmd') + '.' + format),
            readdirSync(dir).filter(x => x.endsWith('.' + format)));
          if (diff.extra.length) throw new Error('Unexpected ' + format + ' files: ' + diff.extra.join(', ') + '. Resolve explicitly.');
        }
        mkdirSync(dir, { recursive: true });
      }
      for (const { target, bytes } of pending) if (!existsSync(target) || !readFileSync(target).equals(bytes)) writeFileSync(target, bytes);
      writeFileSync(manifestPath, serialized);
      verifyInventory(sources);
      console.log('PASS: generated ' + sources.length + ' SVG + ' + sources.length + ' PNG. No clipping/critical text-box overlap detected automatically.');
    }
  } finally {
    await browser.close();
    if (temporary) {
      const resolved = path.resolve(temporary);
      if (path.dirname(resolved) !== temporaryRoot || !path.basename(resolved).startsWith('lab3-sequences-')) {
        throw new Error('Unsafe temporary cleanup path: ' + resolved);
      }
      rmSync(resolved, { recursive: true, force: true });
    }
  }
}
run().catch(error => { console.error('FAIL: ' + error.message); process.exitCode = 1; });
