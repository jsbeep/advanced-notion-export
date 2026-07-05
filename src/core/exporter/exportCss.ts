import type { ExportMode, NotionDocument } from '../types';
import { NOTION_DEFAULTS_CSS } from '../notionDefaultsCss';
import { scopeCss } from './scopeCss';

const SCOPE_SELECTOR = '.anx-export.anx-export.anx-export';

/** Just the stylesheet, scoped the same way the div export embeds it (or raw, for the full-document mode). */
export function exportCssOnly(doc: NotionDocument, exportMode: ExportMode): string {
  const css = `${doc.styleText}${NOTION_DEFAULTS_CSS}`;
  return exportMode === 'div' ? scopeCss(css, SCOPE_SELECTOR) : css;
}
