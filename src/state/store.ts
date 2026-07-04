import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BlockType,
  DesignPreset,
  ExportMode,
  ImageStrategy,
  NotionDocument,
  StyleOverride,
  Theme,
} from '../core/types';
import { detectBlockType } from '../core/blockRegistry';

interface AppState {
  doc: NotionDocument | null;
  overrides: Record<string, StyleOverride>;
  /** Per-image (figure block id) replacement text used only by the 'placeholder' (Tistory) export. */
  tistoryImageText: Record<string, string>;
  selectedBlockId: string | null;
  theme: Theme;
  imageStrategy: ImageStrategy;
  exportMode: ExportMode;
  savedDesigns: DesignPreset[];
  /** live reference to the preview iframe, used to read computed (actual rendered) styles — not persisted */
  previewIframeEl: HTMLIFrameElement | null;

  loadDocument: (doc: NotionDocument) => void;
  clearDocument: () => void;
  selectBlock: (blockId: string | null) => void;
  setOverride: (blockId: string, patch: Partial<StyleOverride>) => void;
  clearOverride: (blockId: string) => void;
  setTistoryImageText: (blockId: string, text: string) => void;
  applyOverrideToSameType: (blockId: string, patch: Partial<StyleOverride>) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setImageStrategy: (strategy: ImageStrategy) => void;
  setExportMode: (mode: ExportMode) => void;
  replaceImageSrc: (blockId: string, newSrc: string) => void;
  deleteBlock: (blockId: string) => void;
  setPreviewIframeEl: (el: HTMLIFrameElement | null) => void;
  saveDesignFromCurrent: (name: string) => void;
  applyDesign: (id: string) => void;
  deleteDesign: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      doc: null,
      overrides: {},
      tistoryImageText: {},
      selectedBlockId: null,
      theme: 'light',
      imageStrategy: 'base64',
      exportMode: 'div',
      savedDesigns: [],
      previewIframeEl: null,

      loadDocument: (doc) => set({ doc, overrides: {}, tistoryImageText: {}, selectedBlockId: null }),

      clearDocument: () => set({ doc: null, overrides: {}, tistoryImageText: {}, selectedBlockId: null }),

      selectBlock: (blockId) => set({ selectedBlockId: blockId }),

      setOverride: (blockId, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [blockId]: { ...state.overrides[blockId], ...patch },
          },
        })),

      clearOverride: (blockId) =>
        set((state) => {
          const next = { ...state.overrides };
          delete next[blockId];
          return { overrides: next };
        }),

      setTistoryImageText: (blockId, text) =>
        set((state) => {
          const next = { ...state.tistoryImageText };
          if (text.trim()) next[blockId] = text;
          else delete next[blockId];
          return { tistoryImageText: next };
        }),

      applyOverrideToSameType: (blockId, patch) => {
        const { doc } = get();
        if (!doc) return;
        const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');
        const source = parsed.getElementById(blockId);
        if (!source) return;
        const type = detectBlockType(source);

        const all = Array.from(
          parsed.querySelectorAll<HTMLElement>('[id]')
        ).filter((el) => detectBlockType(el) === type);

        set((state) => {
          const nextOverrides = { ...state.overrides };
          for (const el of all) {
            nextOverrides[el.id] = { ...nextOverrides[el.id], ...patch };
          }
          return { overrides: nextOverrides };
        });
      },

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setImageStrategy: (imageStrategy) => set({ imageStrategy }),
      setExportMode: (exportMode) => set({ exportMode }),

      replaceImageSrc: (blockId, newSrc) =>
        set((state) => {
          if (!state.doc) return {};
          const parsed = new DOMParser().parseFromString(
            `<div>${state.doc.bodyHtml}</div>`,
            'text/html'
          );
          const block = parsed.getElementById(blockId);
          const img = block?.querySelector('img') ?? (block?.tagName === 'IMG' ? block : null);
          if (!img) return {};
          img.setAttribute('src', newSrc);
          const root = parsed.body.firstElementChild as HTMLElement;
          return { doc: { ...state.doc, bodyHtml: root.innerHTML } };
        }),

      deleteBlock: (blockId) =>
        set((state) => {
          if (!state.doc) return {};
          const parsed = new DOMParser().parseFromString(
            `<div>${state.doc.bodyHtml}</div>`,
            'text/html'
          );
          const block = parsed.getElementById(blockId);
          if (!block) return {};
          block.remove();
          const root = parsed.body.firstElementChild as HTMLElement;

          const nextOverrides = { ...state.overrides };
          delete nextOverrides[blockId];
          const nextTistoryText = { ...state.tistoryImageText };
          delete nextTistoryText[blockId];

          return {
            doc: { ...state.doc, bodyHtml: root.innerHTML },
            overrides: nextOverrides,
            tistoryImageText: nextTistoryText,
            selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
          };
        }),

      setPreviewIframeEl: (el) => set({ previewIframeEl: el }),

      saveDesignFromCurrent: (name) => {
        const { doc, overrides, theme } = get();
        if (!doc) return;
        const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');

        const typeOverrides: Partial<Record<BlockType, StyleOverride>> = {};
        for (const [id, override] of Object.entries(overrides)) {
          const el = parsed.getElementById(id);
          if (!el) continue;
          const type = detectBlockType(el);
          typeOverrides[type] = { ...typeOverrides[type], ...override };
        }

        const preset: DesignPreset = {
          id: `design-${Date.now()}`,
          name,
          createdAt: Date.now(),
          theme,
          typeOverrides,
        };
        set((state) => ({ savedDesigns: [...state.savedDesigns, preset] }));
      },

      applyDesign: (id) => {
        const { doc, savedDesigns } = get();
        const design = savedDesigns.find((d) => d.id === id);
        if (!doc || !design) return;
        const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');

        const nextOverrides: Record<string, StyleOverride> = {};
        parsed.querySelectorAll<HTMLElement>('[id]').forEach((el) => {
          const type = detectBlockType(el);
          const typeOverride = design.typeOverrides[type];
          if (typeOverride) nextOverrides[el.id] = { ...typeOverride };
        });

        set({ overrides: nextOverrides, theme: design.theme });
      },

      deleteDesign: (id) =>
        set((state) => ({ savedDesigns: state.savedDesigns.filter((d) => d.id !== id) })),
    }),
    {
      name: 'advanced-notion-export/state',
      partialize: (state) => ({
        doc: state.doc,
        overrides: state.overrides,
        tistoryImageText: state.tistoryImageText,
        theme: state.theme,
        imageStrategy: state.imageStrategy,
        exportMode: state.exportMode,
        savedDesigns: state.savedDesigns,
      }),
    }
  )
);
