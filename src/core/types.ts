export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'toggle'
  | 'todo'
  | 'bulleted-list'
  | 'numbered-list'
  | 'quote'
  | 'code'
  | 'table'
  | 'divider'
  | 'image'
  | 'bookmark'
  | 'link-to-page'
  | 'column-list'
  | 'other';

export interface BlockInfo {
  id: string;
  type: BlockType;
}

export interface NotionDocument {
  title: string;
  styleText: string;
  bodyHtml: string;
  /** original filename (as referenced in html) -> blob URL, only present for zip uploads */
  images: Record<string, string>;
}

export interface StyleOverride {
  width?: string;
  align?: 'left' | 'center' | 'right';
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginBottom?: string;
  fontSize?: string;
  /** gap between list items (ul/ol > li), applied as margin-bottom on all but the last item */
  listGap?: string;
}

export type ImageStrategy = 'base64' | 'url' | 'placeholder';
export type ExportMode = 'full' | 'div';
export type Theme = 'light' | 'dark';

/** A reusable style preset: per-block-type overrides + theme, portable across documents. */
export interface DesignPreset {
  id: string;
  name: string;
  createdAt: number;
  theme: Theme;
  typeOverrides: Partial<Record<BlockType, StyleOverride>>;
}
