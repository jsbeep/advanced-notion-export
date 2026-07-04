const SANS_STACK =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

/** Corrections so callout/checklist defaults match the real notion.so app (not just the export template). */
const CALLOUT_TODO_CSS = `
  .callout { padding: 12px; align-items: flex-start !important; }
  .callout.block-color-default_background,
  .callout:not([class*="_background"]) { border: 1px solid rgba(55,53,47,0.09); }
  .callout > div:first-child {
    font-size: 1em !important;
    width: 1.5em !important;
    height: 1.5em !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    margin-top: 8px;
    overflow: hidden;
  }
  .callout .icon {
    max-width: 1em;
    max-height: 1em;
    margin-right: 0;
    flex-shrink: 0;
  }
  .callout img.notion-static-icon,
  .callout img.notion-emoji { width: 1em !important; height: 1em !important; }
  .callout > div:last-child { padding-left: 6px !important; padding: 8px !important; }
  ul.to-do-list > li { padding: 6px 6px 1px 6px; }
  .to-do-children-checked { opacity: 0.7 !important; }
`;

/** Card + hover-only icon toolbar for code blocks: copy button, line-wrap toggle, non-mono font. */
const CODE_BLOCK_CSS = `
  .anx-code-block { position: relative; margin: 1.25em 0; border-radius: 10px; overflow: hidden; border: 1px solid #ededeb; background: rgba(135,131,120,0.07); }
  .anx-code-toolbar { position: absolute; top: 8px; right: 8px; z-index: 2; display: flex; gap: 6px; opacity: 0; pointer-events: none; transition: opacity 0.12s ease; }
  .anx-code-block:hover .anx-code-toolbar, .anx-code-toolbar:focus-within { opacity: 1; pointer-events: auto; }
  .anx-code-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px; border: 1px solid rgba(55,53,47,0.16); background: rgba(255,255,255,0.85); color: rgba(55,53,47,0.7); cursor: pointer; font-family: ${SANS_STACK}; }
  .anx-code-btn:hover { background: #fff; color: rgba(55,53,47,0.95); }
  .anx-code-btn.active { border-color: #2383e2; color: #2383e2; background: #fff; }
  .anx-code-block pre.code { margin: 0; border-radius: 0; background: transparent; font-family: ${SANS_STACK}; font-size: 0.875rem; }
`;

// Rebuild the bookmark card to match the real notion.so app rendering (the export template's own
// version is flatter). Inner rules are prefixed with `a.bookmark ` so they out-specify Notion's
// export stylesheet. Layout mirrors the app: info column (flex 4) + image column (flex 1), wrapping
// image above text on narrow widths (wrap-reverse). `min-width:0` everywhere lets long titles/URLs
// truncate instead of forcing the card wider.
const BOOKMARK_CSS = `
  figure:has(> a.bookmark) { overflow: hidden; }
  a.bookmark {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap-reverse;
    width: 100%;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    border: 1px solid rgba(55,53,47,0.16);
    border-radius: 10px;
    transition: background 0.2s ease;
  }
  a.bookmark:hover { background: #f0efed; }
  a.bookmark .bookmark-info { flex: 4 1 180px; min-width: 0; padding: 12px 14px 14px; overflow: hidden; text-align: start; }
  a.bookmark .bookmark-text { min-width: 0; }
  a.bookmark .bookmark-title {
    font-size: 14px; line-height: 20px; font-weight: 500; color: rgb(55,53,47);
    min-height: 24px; margin-bottom: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  a.bookmark .bookmark-description {
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
    font-size: 12px; line-height: 16px; color: rgba(55,53,47,0.65);
  }
  a.bookmark .bookmark-href {
    margin-top: 6px; min-width: 0;
    font-size: 12px; line-height: 16px; color: rgb(55,53,47);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  a.bookmark .bookmark-icon { width: 16px; height: 16px; min-width: 16px; margin-inline-end: 6px; vertical-align: middle; }
  a.bookmark .bookmark-image { flex: 1 1 180px; min-width: 0; max-height: 108px; align-self: stretch; object-fit: cover; border-radius: 0; }
`;

// Notion's export template gives text blocks almost no vertical rhythm; add 8px top/bottom margin,
// but ONLY to standalone text blocks. A plain block <p> is a direct child of `.page-body`, while
// nested paragraphs live inside callouts, columns, toggles (`.indented`), quotes, list items and
// table cells — those manage their own spacing, so exclude them. (`.page-body > p` can't be used:
// the div export strips the `.page-body` wrapper, so we match by "not inside a nesting container".)
const PARAGRAPH_CSS = `
  p:not(.callout p):not(.column p):not(.indented p):not(blockquote p):not(li p):not(td p):not(th p) { margin: 8px 0 !important; }
`;

// Toggle (<details>) polish. `::marker` itself can't be animated (spec only allows color/font/content),
// so the native disclosure triangle is hidden and a custom `summary::before` triangle is rotated via
// transition on open/close. The hover highlight lives on the whole summary. Content expand/collapse is
// a progressive enhancement: `::details-content` + `interpolate-size` animate height in engines that
// support it (Chrome 129+), and everything else falls back to the native instant toggle.
const TOGGLE_CSS = `
  details > summary { cursor: pointer; list-style: none; display: flex; align-items: center; border-radius: 4px; padding: 2px 4px; transition: background 0.15s ease; }
  details > summary::-webkit-details-marker { display: none; }
  details > summary:hover { background: rgba(55,53,47,0.06); }
  details > summary::before {
    content: "";
    flex-shrink: 0;
    width: 0; height: 0;
    margin-right: 6px;
    border-left: 6px solid currentColor;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    transition: transform 0.2s ease;
  }
  details[open] > summary::before { transform: rotate(90deg); }
  @supports (interpolate-size: allow-keywords) {
    :root { interpolate-size: allow-keywords; }
    details::details-content { height: 0; overflow: hidden; transition: height 0.25s ease, content-visibility 0.25s allow-discrete; }
    details[open]::details-content { height: auto; }
  }
`;

export const NOTION_DEFAULTS_CSS = `${CALLOUT_TODO_CSS}${CODE_BLOCK_CSS}${BOOKMARK_CSS}${PARAGRAPH_CSS}${TOGGLE_CSS}`;
