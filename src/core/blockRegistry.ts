import type { BlockType } from './types';

export function detectBlockType(el: Element): BlockType {
  const tag = el.tagName.toLowerCase();
  const cls = el.className || '';

  if (tag === 'hr') return 'divider';
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') return 'heading';
  if (tag === 'blockquote') return 'quote';
  if (cls.includes('anx-code-block') || tag === 'pre') return 'code';
  if (tag === 'table') return 'table';
  if (tag === 'aside' && cls.includes('callout')) return 'callout';
  if (tag === 'details' && cls.includes('toggle')) return 'toggle';
  if (cls.includes('to-do-list')) return 'todo';
  if (cls.includes('bulleted-list') || tag === 'ul') return 'bulleted-list';
  if (cls.includes('numbered-list') || tag === 'ol') return 'numbered-list';
  if (cls.includes('column-list')) return 'column-list';
  if (cls.includes('link-to-page')) return 'link-to-page';
  if (cls.includes('bookmark')) return 'bookmark';
  if (tag === 'figure' && cls.includes('image')) return 'image';
  if (tag === 'p') return 'paragraph';
  return 'other';
}

export const SELECTABLE_SELECTOR =
  'p, h1, h2, h3, aside.callout, details.toggle, ul, ol, blockquote, .anx-code-block, table, hr, figure.image';
