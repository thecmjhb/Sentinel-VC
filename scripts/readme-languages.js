import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LANGUAGES } from '../languages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const readmePath = code => code === 'en' ? 'README.md' : code === 'bn' ? 'README.bn.md' :
  `docs/i18n/README.${code === 'zh' ? 'zh-CN' : code}.md`;
const relative = (file, target) => path.relative(path.dirname(file), target).replaceAll('\\', '/');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function navigation(file) {
  const links = Object.values(LANGUAGES).map(t =>
    `<a href="${relative(file, readmePath(t.code))}" title="${escape(t.name)}"><img src="${relative(file, `assets/languages/${t.code}.svg`)}" width="64" height="28" alt="${escape(t.name)}"></a>`);
  // Adjacent inline images have their own four-pixel gutters and wrap without custom CSS.
  // Explicitly split into two desktop rows; each row can wrap on a narrow screen.
  return '<!-- languages:start -->\n<p align="center" dir="ltr">\n' +
    links.slice(0, 10).join('') + '<br>\n' + links.slice(10).join('') + '\n</p>\n<!-- languages:end -->';
}

export function updateLanguageNavigation() {
  mkdirSync(path.join(root, 'assets/languages'), { recursive: true });
  for (const t of Object.values(LANGUAGES)) {
    const label = t.code === 'id' ? 'Indonesia' : t.name;
    const rtl = ['ar', 'ur', 'fa'].includes(t.code);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="28" viewBox="0 0 64 28" role="img" aria-label="${escape(t.name)}">
  <title>${escape(t.name)}</title>
  <rect x="2.5" y="2.5" width="59" height="23" rx="6" fill="#161b22" stroke="#3d5875"/>
  <text x="32" y="18" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="500" fill="#e6edf3"${rtl ? ' direction="rtl"' : ''}>${escape(label)}</text>
</svg>\n`;
    writeFileSync(path.join(root, `assets/languages/${t.code}.svg`), svg);
    const file = readmePath(t.code);
    const target = path.join(root, file);
    let content = readFileSync(target, 'utf8');
    if (content.includes('<!-- languages:start -->')) {
      content = content.replace(/<!-- languages:start -->[\s\S]*?<!-- languages:end -->/, navigation(file));
    } else {
      const start = content.indexOf('[English](');
      if (start < 0) throw new Error(`Missing language navigation: ${file}`);
      const end = content.indexOf('\n\n', content.lastIndexOf('[తెలుగు](', content.indexOf('\n## ', start) > 0 ? content.indexOf('\n## ', start) : undefined));
      if (end < start) throw new Error(`Missing language navigation end: ${file}`);
      content = content.slice(0, start) + navigation(file) + content.slice(end);
    }
    writeFileSync(target, content);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  updateLanguageNavigation();
  console.log('Updated 20 README language selectors and local SVG buttons.');
}
