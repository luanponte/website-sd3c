/**
 * Extrai as camadas PNG (base64) dos arquivos originais
 *  - sabores-simbolo.html      -> assets/img/simbolo/<id>.png
 *  - sabores-em-movimento.html -> assets/img/poster/<id>.png
 * Os bytes são idênticos aos originais (fidelidade visual 100%),
 * mas ficam cacheáveis e ~33% menores que o base64 embutido.
 *
 * Uso:  node tools/extract-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
  ['sabores-simbolo.html', 'assets/img/simbolo'],
  ['sabores-em-movimento.html', 'assets/img/poster'],
];
const re = /id="([\w-]+)"[^>]*?src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g;

for (const [file, outDir] of jobs) {
  const html = readFileSync(join(root, file), 'utf8');
  mkdirSync(join(root, outDir), { recursive: true });
  let n = 0;
  for (const [, id, b64] of html.matchAll(re)) {
    writeFileSync(join(root, outDir, `${id}.png`), Buffer.from(b64, 'base64'));
    n++;
  }
  console.log(`${file}: ${n} camadas -> ${outDir}`);
}
