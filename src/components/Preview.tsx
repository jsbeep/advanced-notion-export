import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../state/store';
import { applyListGap, overrideToCssText } from '../core/styleEngine';
import { SELECTABLE_SELECTOR } from '../core/blockRegistry';
import { NOTION_DEFAULTS_CSS } from '../core/notionDefaultsCss';
import { CHECK_ICON } from '../core/codeIcons';
import type { StyleOverride } from '../core/types';

const PREVIEW_CHROME_CSS = `
  html, body { margin: 0; }
  body { padding: 2.5em 3em; }
  [data-anx-hover] { outline: 2px solid #58a9d7; outline-offset: 3px; cursor: pointer; }
  [data-anx-selected] { outline: 2px solid #eb5757 !important; outline-offset: 3px; }
  .anx-resize-handle {
    position: fixed;
    width: 6px;
    height: 32px;
    margin-left: -3px;
    border-radius: 3px;
    background: #eb5757;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.85);
    cursor: ew-resize;
    z-index: 9999;
    display: none;
  }
  .anx-resize-handle:hover { background: #d64444; }
  ${NOTION_DEFAULTS_CSS}
`;

const PREVIEW_DARK_CSS = `
  html, body { background: #191919 !important; color: #d4d4d4 !important; }
  a { color: #6ab0f3 !important; }
  hr { border-bottom-color: rgba(255,255,255,0.15) !important; }
  .callout.block-color-default_background,
  .callout:not([class*="_background"]) { border-color: rgba(255,255,255,0.15) !important; }
  table, th, td { border-color: rgba(255,255,255,0.15) !important; }
  th { color: rgba(212,212,212,0.6) !important; }
  .simple-table-header-color { background: #2a2a2a !important; color: #d4d4d4 !important; }
  blockquote { border-left-color: #d4d4d4 !important; }
  .anx-code-btn { background: rgba(32,32,32,0.85) !important; color: rgba(230,230,230,0.75) !important; border-color: rgba(255,255,255,0.16) !important; }
  .anx-code-btn:hover { background: #2a2a2a !important; color: #fff !important; }
  .anx-code-btn.active { border-color: #4da3ff !important; color: #4da3ff !important; }
`;

function buildBaseMarkup(styleText: string, bodyHtml: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${styleText}</style><style id="anx-dynamic"></style></head><body>${bodyHtml}</body></html>`;
}

/** Snapshot of each block's original (pre-override) inline style, so overrides can be un-applied cleanly. */
function getBaseStyleMap(bodyHtml: string): Map<string, string> {
  const parsed = new DOMParser().parseFromString(`<div>${bodyHtml}</div>`, 'text/html');
  const map = new Map<string, string>();
  parsed.querySelectorAll('[id]').forEach((el) => {
    map.set(el.id, el.getAttribute('style') ?? '');
  });
  return map;
}

const MIN_RESIZE_WIDTH = 80;
const MIN_CANVAS_WIDTH = 320;

export function Preview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const loadedRef = useRef(false);
  const baseStyleMapRef = useRef<Map<string, string>>(new Map());
  const appliedOverrideIdsRef = useRef<Set<string>>(new Set());
  const selectedRef = useRef<string | null>(null);
  const handleElRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ blockId: string; startX: number; startWidth: number } | null>(null);

  const doc = useAppStore((s) => s.doc);
  const overrides = useAppStore((s) => s.overrides);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);
  const selectBlock = useAppStore((s) => s.selectBlock);
  const setOverride = useAppStore((s) => s.setOverride);
  const theme = useAppStore((s) => s.theme);
  const setPreviewIframeEl = useAppStore((s) => s.setPreviewIframeEl);

  const positionHandle = (idoc: Document, blockId: string | null) => {
    const handle = handleElRef.current;
    if (!handle) return;
    const el = blockId ? idoc.getElementById(blockId) : null;
    if (!el) {
      handle.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    handle.style.display = 'block';
    handle.style.left = `${rect.right}px`;
    handle.style.top = `${rect.top + rect.height / 2 - 16}px`;
  };

  const createResizeHandle = (idoc: Document): HTMLDivElement => {
    const handle = idoc.createElement('div');
    handle.className = 'anx-resize-handle';

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const el = idoc.getElementById(drag.blockId) as HTMLElement | null;
      if (!el) return;
      const maxWidth = idoc.body.clientWidth;
      const next = Math.min(Math.max(drag.startWidth + (e.clientX - drag.startX), MIN_RESIZE_WIDTH), maxWidth);
      el.style.maxWidth = `${next}px`;
      el.style.width = '100%';
      positionHandle(idoc, drag.blockId);
    };

    const onMouseUp = () => {
      const drag = dragRef.current;
      idoc.removeEventListener('mousemove', onMouseMove);
      idoc.removeEventListener('mouseup', onMouseUp);
      idoc.body.style.cursor = '';
      dragRef.current = null;
      if (!drag) return;
      const el = idoc.getElementById(drag.blockId) as HTMLElement | null;
      if (!el) return;
      const width = Math.round(el.getBoundingClientRect().width);
      setOverride(drag.blockId, { width: `${width}px` });
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const blockId = selectedRef.current;
      if (!blockId) return;
      const el = idoc.getElementById(blockId);
      if (!el) return;
      dragRef.current = { blockId, startX: e.clientX, startWidth: el.getBoundingClientRect().width };
      idoc.body.style.cursor = 'ew-resize';
      idoc.addEventListener('mousemove', onMouseMove);
      idoc.addEventListener('mouseup', onMouseUp);
    });
    handle.addEventListener('click', (e) => e.stopPropagation());

    idoc.body.appendChild(handle);
    return handle;
  };

  useEffect(() => {
    setPreviewIframeEl(iframeRef.current);
    return () => setPreviewIframeEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncOverrides = (idoc: Document, current: Record<string, StyleOverride>) => {
    const baseMap = baseStyleMapRef.current;
    const ids = new Set([...appliedOverrideIdsRef.current, ...Object.keys(current)]);
    for (const id of ids) {
      const el = idoc.getElementById(id);
      if (!el) continue;
      const base = baseMap.get(id) ?? '';
      const override = current[id];
      const overrideCss = override ? overrideToCssText(override) : '';
      el.setAttribute('style', overrideCss ? `${base};${overrideCss}` : base);
      if (el.tagName === 'UL' || el.tagName === 'OL') applyListGap(el, override?.listGap);
    }
    appliedOverrideIdsRef.current = new Set(Object.keys(current));
    positionHandle(idoc, selectedRef.current);
  };

  const syncSelection = (idoc: Document, id: string | null) => {
    if (selectedRef.current) idoc.getElementById(selectedRef.current)?.removeAttribute('data-anx-selected');
    if (id) idoc.getElementById(id)?.setAttribute('data-anx-selected', 'true');
    selectedRef.current = id;
    positionHandle(idoc, id);
  };

  // structural rebuild — only when the document content itself changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !doc) return;
    loadedRef.current = false;
    baseStyleMapRef.current = getBaseStyleMap(doc.bodyHtml);
    appliedOverrideIdsRef.current = new Set();
    selectedRef.current = null;

    const handleLoad = () => {
      const idoc = iframe.contentDocument;
      if (!idoc) return;
      loadedRef.current = true;

      let hovered: Element | null = null;
      const onOver = (e: MouseEvent) => {
        const target = (e.target as Element)?.closest(SELECTABLE_SELECTOR);
        if (target === hovered) return;
        hovered?.removeAttribute('data-anx-hover');
        hovered = target;
        hovered?.setAttribute('data-anx-hover', 'true');
      };
      const onOut = () => {
        hovered?.removeAttribute('data-anx-hover');
        hovered = null;
      };
      const onCodeAction = (e: MouseEvent) => {
        const btn = (e.target as Element)?.closest('[data-anx-action]') as HTMLElement | null;
        if (!btn) return;
        const block = btn.closest('.anx-code-block');
        if (!block) return;
        const action = btn.getAttribute('data-anx-action');
        if (action === 'copy') {
          const code = block.querySelector('code');
          if (code) idoc.defaultView?.navigator.clipboard?.writeText(code.textContent ?? '');
          const original = btn.innerHTML;
          btn.innerHTML = CHECK_ICON;
          idoc.defaultView?.setTimeout(() => {
            btn.innerHTML = original;
          }, 1200);
        }
      };

      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        if ((e.target as Element)?.closest('[data-anx-action]')) return;
        const target = (e.target as Element)?.closest(SELECTABLE_SELECTOR);
        selectBlock(target?.id ?? null);
      };

      idoc.body.addEventListener('mouseover', onOver);
      idoc.body.addEventListener('mouseout', onOut);
      idoc.body.addEventListener('click', onCodeAction);
      idoc.body.addEventListener('click', onClick);

      handleElRef.current = createResizeHandle(idoc);
      idoc.defaultView?.addEventListener('scroll', () => positionHandle(idoc, selectedRef.current));

      const dynamicStyle = idoc.getElementById('anx-dynamic');
      if (dynamicStyle) {
        dynamicStyle.textContent = `${PREVIEW_CHROME_CSS}${
          useAppStore.getState().theme === 'dark' ? PREVIEW_DARK_CSS : ''
        }`;
      }

      syncOverrides(idoc, useAppStore.getState().overrides);
      syncSelection(idoc, useAppStore.getState().selectedBlockId);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.srcdoc = buildBaseMarkup(doc.styleText, doc.bodyHtml);

    return () => iframe.removeEventListener('load', handleLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.styleText, doc?.bodyHtml]);

  // patch overrides onto the already-rendered document, no reload
  useEffect(() => {
    const idoc = iframeRef.current?.contentDocument;
    if (!idoc || !loadedRef.current) return;
    syncOverrides(idoc, overrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides]);

  // patch selection highlight, no reload
  useEffect(() => {
    const idoc = iframeRef.current?.contentDocument;
    if (!idoc || !loadedRef.current) return;
    syncSelection(idoc, selectedBlockId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId]);

  // patch theme CSS in place, no reload
  useEffect(() => {
    const idoc = iframeRef.current?.contentDocument;
    if (!idoc || !loadedRef.current) return;
    const dynamicStyle = idoc.getElementById('anx-dynamic');
    if (dynamicStyle) {
      dynamicStyle.textContent = `${PREVIEW_CHROME_CSS}${theme === 'dark' ? PREVIEW_DARK_CSS : ''}`;
    }
  }, [theme]);

  const startPanelDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = canvasRef.current?.getBoundingClientRect().width ?? 0;
    setIsPanelDragging(true);

    const onMove = (ev: MouseEvent) => {
      const maxWidth = panelRef.current?.clientWidth ?? startWidth;
      const next = Math.min(Math.max(startWidth + (ev.clientX - startX) * 2, MIN_CANVAS_WIDTH), maxWidth);
      setCanvasWidth(Math.round(next));
    };
    const onUp = () => {
      setIsPanelDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (!doc) return null;

  return (
    <div className="anx-preview-panel-inner" ref={panelRef}>
      <div
        className="anx-preview-canvas"
        ref={canvasRef}
        style={{ width: canvasWidth ? `${canvasWidth}px` : '100%' }}
      >
        <iframe
          ref={iframeRef}
          title="notion-preview"
          className="anx-preview-frame"
          sandbox="allow-same-origin allow-scripts"
        />
        <div
          className={isPanelDragging ? 'anx-panel-resize-handle dragging' : 'anx-panel-resize-handle'}
          onMouseDown={startPanelDrag}
          onDoubleClick={() => setCanvasWidth(null)}
          title="드래그: 미리보기 폭 조절 · 더블클릭: 전체 폭"
        >
          {canvasWidth && isPanelDragging && <span className={`anx-panel-resize-badge ${isPanelDragging ? 'dragging' : ''}`}>{canvasWidth}px</span>}
        </div>
      </div>
    </div>
  );
}
