import type { ImageStrategy } from '../types';

async function toDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function filenameFromSrc(src: string): string {
  try {
    const clean = src.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() ?? 'image');
  } catch {
    return 'image';
  }
}

/** Mutates images inside `container` according to the chosen export strategy. */
export async function applyImageStrategy(
  container: Element,
  strategy: ImageStrategy,
  tistoryText: Record<string, string> = {}
): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = img.getAttribute('src') ?? '';
    if (!src) continue;
    const filename = img.getAttribute('data-anx-filename') ?? filenameFromSrc(src);

    // Bookmark preview/favicon images are external, decorative, and part of a link card — never
    // swap them for a "re-upload me" placeholder box; keep their URL so the card renders as-is.
    const effectiveStrategy =
      strategy === 'placeholder' && img.closest('.bookmark') ? 'url' : strategy;

    if (effectiveStrategy === 'base64') {
      if (src.startsWith('data:')) continue;
      try {
        img.setAttribute('src', await toDataUrl(src));
      } catch {
        // leave original src if fetch fails (e.g. blocked external host)
      }
      continue;
    }

    if (effectiveStrategy === 'url') {
      if (/^https?:\/\//i.test(src)) continue;
      // blob:/data: URLs only work inside this app session — fall back to base64 so the export still renders.
      try {
        img.setAttribute('src', await toDataUrl(src));
      } catch {
        // no-op
      }
      continue;
    }

    // placeholder: the block gets replaced either with a user-supplied Tistory macro/alt text, or a
    // Ctrl+F searchable marker box for manual re-upload in the Tistory editor.
    const anchor = img.closest('a');
    const target = anchor ?? img;
    const blockId = img.closest('[id]')?.id;
    const replacement = blockId ? tistoryText[blockId]?.trim() : undefined;

    if (replacement) {
      // Insert the entered text verbatim. Parse it as HTML so a Tistory image macro copied from a
      // page's HTML source (already entity-escaped, e.g. `&amp;`) round-trips to identical output
      // instead of being double-escaped.
      const tpl = document.createElement('template');
      tpl.innerHTML = replacement;
      target.replaceWith(...Array.from(tpl.content.childNodes));
      continue;
    }

    const marker = document.createComment(` @IMG-${String(i + 1).padStart(2, '0')}: ${filename} `);
    const box = document.createElement('div');
    box.setAttribute(
      'style',
      'border:2px dashed rgba(55,53,47,0.35);border-radius:8px;padding:1.5em;text-align:center;' +
        'color:rgba(55,53,47,0.6);font-size:0.9em;background:rgba(55,53,47,0.03);'
    );
    box.textContent = `[이미지 자리 @IMG-${String(i + 1).padStart(2, '0')}: ${filename}] — 이 자리에 이미지를 직접 첨부하세요.`;
    target.replaceWith(marker, box);
  }
}
