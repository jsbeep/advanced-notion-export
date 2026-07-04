import type { ImageStrategy, NotionDocument, StyleOverride } from '../types';
import { applyOverrides } from '../styleEngine';
import { applyImageStrategy } from './imageStrategy';
import { NOTION_DEFAULTS_CSS } from '../notionDefaultsCss';
import { buildCodeBlockScriptTag } from './codeBlockScript';
import { scopeCss } from './scopeCss';

const CONTAINER_CLASS = 'anx-export';
// Repeating the scope class bumps specificity (3 classes) so a host blog theme's own rules
// (e.g. `.article p { ... }`) don't override the exported design. Inline user overrides still win.
const SCOPE_SELECTOR = '.anx-export.anx-export.anx-export';

/** Toggle blocks (<details>) are exported expanded by Notion; collapse them so they start closed. */
export function collapseToggles(container: Element) {
  container.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'));
}

function makeColumnsResponsive(container: Element) {
  container.querySelectorAll('.column-list').forEach((list) => {
    (list as HTMLElement).style.flexWrap = 'wrap';
  });
  container.querySelectorAll('.column-list > .column').forEach((col) => {
    const el = col as HTMLElement;
    el.style.flex = '1 1 240px';
    el.style.minWidth = '240px';
  });
}

/**
 * Responsive, self-contained <div> for pasting into Tistory or embedding as a component.
 *
 * Rather than baking every element's computed style onto a `style` attribute (which produced
 * enormous, unreadable markup), the Notion stylesheet is shipped once as a single scoped <style>
 * tag. Selectors are rewritten under `.anx-export` so they never leak into the host page, class
 * names stay on the markup, and only user overrides remain as small inline styles on edited blocks.
 */
export async function exportDivHtml(
  doc: NotionDocument,
  overrides: Record<string, StyleOverride>,
  imageStrategy: ImageStrategy,
  tistoryImageText: Record<string, string> = {}
): Promise<string> {
  const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');
  const pageBody = parsed.querySelector('.page-body') ?? (parsed.body.firstElementChild as HTMLElement);
  const container = pageBody.cloneNode(true) as HTMLElement;

  applyOverrides(container, overrides);
  makeColumnsResponsive(container);
  collapseToggles(container);
  await applyImageStrategy(container, imageStrategy, tistoryImageText);

  const scopedCss = scopeCss(`${doc.styleText}${NOTION_DEFAULTS_CSS}`, SCOPE_SELECTOR);

  const hasCodeBlock = container.querySelector('.anx-code-block') !== null;
  const script = hasCodeBlock ? buildCodeBlockScriptTag() : '';

  return (
    `<style>${scopedCss}</style>` +
    `<div class="${CONTAINER_CLASS}" style="max-width:900px;width:100%;margin:0 auto;box-sizing:border-box;overflow-wrap:break-word;">${container.innerHTML}</div>` +
    script
  );
}
