// 版本号规则执行器：小改动 +0.0.1，成体系的升级 +0.1.0，不动宿主契约永不进 2.x
// 用法：node scripts/bump.mjs patch   → 1.1.72 -> 1.1.73
//       node scripts/bump.mjs minor   → 1.1.72 -> 1.2.0
//       node scripts/bump.mjs show    → 只打印当前版本
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = path.join(ROOT, 'package.json');
const cliPath = path.join(ROOT, 'client.js');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const cur = String(pkg.version || '0.0.0');
const [major, minor, patch] = cur.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);

const mode = (process.argv[2] || 'show').toLowerCase();

if (mode === 'show') {
  console.log(`current version: ${cur}`);
  console.log(`major=${major} minor=${minor} patch=${patch}`);
  process.exit(0);
}

let next;
if (mode === 'patch') next = `${major}.${minor}.${patch + 1}`;
else if (mode === 'minor') next = `${major}.${minor + 1}.0`;
else {
  console.error('usage: node scripts/bump.mjs patch|minor|show');
  process.exit(1);
}

if (major > 1) {
  console.error(`拒绝跳大版本：当前 ${cur}。本插件的 major 固定为 1（宿主契约未变，见 docs/VERSIONING.md）`);
  process.exit(1);
}

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

let cli = fs.readFileSync(cliPath, 'utf8');
const chipRe = /(h\("b", null, ")v\d+\.\d+\.\d+(")/g;
const hits = (cli.match(chipRe) || []).length;
if (hits) cli = cli.replace(chipRe, `$1v${next}$2`);
fs.writeFileSync(cliPath, cli, 'utf8');

console.log(`version ${cur} -> ${next}  (package.json + client.js chip x${hits})`);
console.log('接下来：node scripts/embed-default-prompt.mjs（若改了提示词）→ 发布');
