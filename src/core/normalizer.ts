import { COPY_ICON } from './codeIcons';

let fallbackIdCounter = 0;

function stripCdnScriptsAndLinks(container: Element) {
  container.querySelectorAll('script').forEach((el) => el.remove());
  container.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());
}

/** Notion export splits every consecutive list item into its own <ul>/<ol> — merge siblings back together. */
function mergeAdjacentLists(container: Element) {
  const lists = Array.from(container.querySelectorAll('ul, ol'));
  for (const list of lists) {
    if (!list.isConnected) continue;
    let next = list.nextElementSibling;
    while (
      next &&
      next.tagName === list.tagName &&
      next.className === list.className
    ) {
      while (next.firstChild) list.appendChild(next.firstChild);
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }
  }
}

function assignFallbackIds(container: Element) {
  const topLevel = container.querySelectorAll(
    'p, h1, h2, h3, aside, details, ul, ol, blockquote, pre, table, hr, figure'
  );
  topLevel.forEach((el) => {
    if (!el.id) {
      el.id = `anx-block-${++fallbackIdCounter}`;
    }
  });
}

/**
 * Notion bakes a fixed `style="width:412px"` directly onto the <img>, not the <figure>. That means
 * our width override/resize-handle (which targets the figure, since that's the selectable block)
 * had zero visual effect — the img's own hardcoded width always won. Move that width onto the figure
 * as a max-width and make the img (and its optional <a> wrapper) fill 100% of it instead.
 */
function normalizeImageWidths(container: Element) {
  container.querySelectorAll('figure.image').forEach((figure) => {
    const el = figure as HTMLElement;
    const img = figure.querySelector('img');
    if (!img) return;

    const originalWidth = img.style.width;
    if (originalWidth) el.style.maxWidth = originalWidth;
    el.style.width = '100%';

    const anchor = figure.querySelector(':scope > a') as HTMLElement | null;
    if (anchor) {
      anchor.style.display = 'block';
      anchor.style.width = '100%';
    }

    img.style.width = '100%';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
  });
}

/**
 * Wraps each code block in a card with a hover-only copy/wrap icon toolbar, matching the real notion.so app.
 * Buttons carry only `data-anx-action` markers (no inline onclick) — many CMS/blog sanitizers (Tistory
 * included) strip onclick="" attributes from pasted HTML, so the actual click behavior is wired up
 * separately by a delegated listener (see codeBlockScript.ts for exports, Preview.tsx for the live preview).
 */
function wrapCodeBlocks(container: Element) {
  const blocks = Array.from(container.querySelectorAll('pre.code'));
  for (const pre of blocks) {
    const el = pre as HTMLElement;
    const originalId = el.id;

    const wrapper = el.ownerDocument.createElement('div');
    wrapper.className = 'anx-code-block';
    if (originalId) wrapper.id = originalId;

    el.removeAttribute('id');
    if (originalId) el.id = `${originalId}__pre`;
    el.classList.remove('code-wrap');
    el.style.whiteSpace = 'pre';
    el.style.overflowX = 'auto';

    const toolbar = el.ownerDocument.createElement('div');
    toolbar.className = 'anx-code-toolbar';

    const copyBtn = el.ownerDocument.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'anx-code-btn';
    copyBtn.title = '코드 복사';
    copyBtn.setAttribute('aria-label', '코드 복사');
    copyBtn.setAttribute('data-anx-action', 'copy');
    copyBtn.innerHTML = COPY_ICON;

    toolbar.appendChild(copyBtn);

    el.parentElement?.insertBefore(wrapper, el);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(el);
  }
}

export function normalizeBodyHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div id="__anx_root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__anx_root');
  if (!root) return html;

  stripCdnScriptsAndLinks(root);
  mergeAdjacentLists(root);
  assignFallbackIds(root);
  normalizeImageWidths(root);
  wrapCodeBlocks(root);

  return root.innerHTML;
}
