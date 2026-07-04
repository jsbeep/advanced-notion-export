import type { StyleOverride } from './types';

const ALIGN_TO_MARGIN: Record<NonNullable<StyleOverride['align']>, string> = {
  left: '0 auto 0 0',
  center: '0 auto',
  right: '0 0 0 auto',
};

export function overrideToCssText(override: StyleOverride): string {
  const decls: string[] = [];
  if (override.width) decls.push(`max-width:${override.width}`, `width:100%`);
  if (override.align) {
    decls.push(`display:block`);
    decls.push(`margin:${ALIGN_TO_MARGIN[override.align]}`);
    decls.push(`text-align:${override.align}`);
  }
  if (override.paddingTop) decls.push(`padding-top:${override.paddingTop}`);
  if (override.paddingRight) decls.push(`padding-right:${override.paddingRight}`);
  if (override.paddingBottom) decls.push(`padding-bottom:${override.paddingBottom}`);
  if (override.paddingLeft) decls.push(`padding-left:${override.paddingLeft}`);
  if (override.marginTop) decls.push(`margin-top:${override.marginTop}`);
  if (override.marginBottom) decls.push(`margin-bottom:${override.marginBottom}`);
  if (override.fontSize) decls.push(`font-size:${override.fontSize}`);
  return decls.join(';');
}

/** Sets/clears the gap between a list's direct <li> children (margin-bottom on all but the last). */
export function applyListGap(el: Element, listGap: string | undefined) {
  const items = Array.from(el.children).filter((child) => child.tagName === 'LI') as HTMLElement[];
  items.forEach((li, i) => {
    li.style.marginBottom = listGap && i < items.length - 1 ? listGap : '';
  });
}

/** Applies style overrides (block id -> override) onto matching elements inside a document/container. */
export function applyOverrides(root: ParentNode, overrides: Record<string, StyleOverride>) {
  for (const [id, override] of Object.entries(overrides)) {
    const el = root.querySelector(`[id="${CSS.escape(id)}"]`) as HTMLElement | null;
    if (!el) continue;
    const cssText = overrideToCssText(override);
    if (cssText) el.style.cssText = `${el.style.cssText};${cssText}`;
    if (el.tagName === 'UL' || el.tagName === 'OL') applyListGap(el, override.listGap);
  }
}
