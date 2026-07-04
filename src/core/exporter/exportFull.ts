import type { ImageStrategy, NotionDocument, StyleOverride } from '../types';
import { applyOverrides } from '../styleEngine';
import { applyImageStrategy } from './imageStrategy';
import { NOTION_DEFAULTS_CSS } from '../notionDefaultsCss';
import { buildCodeBlockScriptTag } from './codeBlockScript';
import { collapseToggles } from './exportDiv';

/** Full standalone <html> document — keeps the scoped Notion <style> sheet, for use in a document explorer. */
export async function exportFullHtml(
  doc: NotionDocument,
  overrides: Record<string, StyleOverride>,
  imageStrategy: ImageStrategy,
  tistoryImageText: Record<string, string> = {}
): Promise<string> {
  const container = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html')
    .body.firstElementChild as HTMLElement;

  applyOverrides(container, overrides);
  collapseToggles(container);
  await applyImageStrategy(container, imageStrategy, tistoryImageText);

  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8"/>',
    `<title>${doc.title}</title>`,
    `<style>${doc.styleText}${NOTION_DEFAULTS_CSS}</style>`,
    '</head>',
    `<body>${container.innerHTML}${buildCodeBlockScriptTag()}</body>`,
    '</html>',
  ].join('\n');
}
