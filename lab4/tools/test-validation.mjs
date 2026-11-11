import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tools = dirname(fileURLToPath(import.meta.url));
const root = resolve(tools, '../..');
const lock = JSON.parse(readFileSync(resolve(tools, 'toolchain.json'), 'utf8'));
const java = process.env.LAB4_JAVA ?? resolve(root, '.cache/lab4', lock.jre.java);
const jar = resolve(root, '.cache/lab4', lock.plantuml.file);
if (!existsSync(java) || !existsSync(jar)) {
  console.error('NOT RUN validation regression tests. Run lab4/tools/setup.ps1 first.');
  process.exit(2);
}
const cache = resolve(root, '.cache');
mkdirSync(cache, { recursive: true });
const fixture = mkdtempSync(resolve(cache, 'lab4-audit-tests-'));
const activity = resolve(fixture, 'lab4/activity.puml');
const original = readFileSync(resolve(root, 'lab4/activity.puml'));
function run(mode = '--check') {
  return spawnSync(process.execPath, [resolve(fixture, 'lab4/tools/validate.mjs'), mode], {
    env: { ...process.env, LAB4_JAVA: java },
    encoding: 'utf8', windowsHide: true, timeout: 120000,
  });
}
try {
  for (const name of [
    'spec.md', 'activity.puml', 'tools/validate.mjs', 'tools/toolchain.json',
    'render/manifest.json', 'render/activity.svg', 'render/activity.png',
    'render/activity-observation.svg', 'render/activity-observation.png',
    'render/activity-concurrency.svg', 'render/activity-concurrency.png',
  ]) {
    const target = resolve(fixture, 'lab4', name);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(root, 'lab4', name), target);
  }
  const fixtureJar = resolve(fixture, '.cache/lab4', lock.plantuml.file);
  mkdirSync(dirname(fixtureJar), { recursive: true });
  copyFileSync(jar, fixtureJar);
  const positive = run();
  assert.equal(positive.status, 0, positive.stderr);
  console.log('PASS clean isolated fixture reproduces all renders');
  for (const [name, mutate, expected, mode = '--check'] of [
    ['missing join', text => text.replace('end fork', ''), 'Missing join'],
    ['waiting event before join', text => text.replace('fork again', ':Чекати подію; <<acceptEvent>>\nfork again'), 'Join must not wait'],
    ['missing alternative timeout', text => text.replace(' АБО Тайм-аут', ''), 'alternative timeout trigger'],
    ['human-dependent server completion', text => text.replace(':Завершити серверну обробку', '|Бібліотекар|\n:Завершити серверну обробку'), 'depends on a human role'],
    ['second issue action', text => text.replace("' A08", ":Виконати атомарну операцію видачі повторно;\n' A08"), 'Repeated issue'],
    ['inverted date guard', text => text.replace('due_at >= loaned_at?', 'due_at < loaned_at?'), 'Date condition must be due_at >= loaned_at', '--render'],
    ['confirmation in failed-commit branch', text => {
      const confirmation = text.split('\n').find(line => line.includes('<<sendSignal>>'));
      assert(confirmation, 'Missing confirmation to mutate');
      return text.replace(confirmation, '').replace("  ' A10", `${confirmation}\n  ' A10`);
    }, 'Confirmation requires successful commit on its control-flow path', '--render'],
    ['stale source manifest', text => text.replace('@enduml', "' changed source\n@enduml"), 'Stale render manifest'],
  ]) {
    const mutated = mutate(original.toString('utf8'));
    assert.notEqual(mutated, original.toString('utf8'), `${name} did not change the fixture`);
    writeFileSync(activity, mutated);
    const result = run(mode);
    assert.notEqual(result.status, 0, `${name} was accepted`);
    assert(result.stderr.includes(expected), result.stderr);
    console.log(`PASS rejected ${name}`);
    writeFileSync(activity, original);
  }
  const pngPath = resolve(fixture, 'lab4/render/activity.png');
  const png = readFileSync(pngPath);
  const changed = Buffer.from(png);
  changed[changed.length - 1] ^= 1;
  writeFileSync(pngPath, changed);
  const stale = run();
  assert.notEqual(stale.status, 0);
  assert(stale.stderr.includes('Stale or modified activity.png'), stale.stderr);
  console.log('PASS rejected modified PNG');

  const invalid = resolve(fixture, 'invalid.puml');
  writeFileSync(invalid, '@startuml\nstart\nINVALID PLANTUML COMMAND ???\n@enduml\n');
  const syntax = spawnSync(java, ['-Djava.awt.headless=true', '-jar', jar, '-checkonly', invalid], {
    encoding: 'utf8', windowsHide: true, timeout: 120000,
  });
  assert.equal(syntax.status, 200, syntax.stderr);
  console.log('PASS real PlantUML parser rejects invalid input with exit 200');
} finally {
  // Only the directory created above is removed, after checking its real location.
  const actual = realpathSync(fixture);
  assert(actual.startsWith(`${realpathSync(cache)}${sep}lab4-audit-tests-`));
  rmSync(actual, { recursive: true });
}
