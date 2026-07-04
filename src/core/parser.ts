import JSZip from 'jszip';
import type { NotionDocument } from './types';
import { normalizeBodyHtml } from './normalizer';

function extractTitle(doc: Document): string {
  const pageTitle = doc.querySelector('.page-title');
  if (pageTitle?.textContent?.trim()) return pageTitle.textContent.trim();
  return doc.querySelector('title')?.textContent?.trim() ?? '제목 없는 문서';
}

function extractStyleText(doc: Document): string {
  const styles = Array.from(doc.querySelectorAll('style'));
  return styles
    .map((s) => s.textContent ?? '')
    // drop the KaTeX CDN @import — external CSS import is unusable in a self-contained export
    .filter((text) => !text.includes('@import'))
    .join('\n');
}

function extractArticleHtml(doc: Document): string {
  const article = doc.querySelector('article.page');
  if (article) return article.innerHTML;
  return doc.body.innerHTML;
}

export function buildDocument(rawHtml: string, images: Record<string, string> = {}): NotionDocument {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const title = extractTitle(doc);
  const styleText = extractStyleText(doc);
  const bodyHtml = normalizeBodyHtml(extractArticleHtml(doc));
  return { title, styleText, bodyHtml, images };
}

export async function parseHtmlFile(file: File): Promise<NotionDocument> {
  const text = await file.text();
  return buildDocument(text, {});
}

export async function parseZipFile(file: File): Promise<NotionDocument> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((f) => !f.dir);

  const htmlEntry = entries.find((f) => f.name.toLowerCase().endsWith('.html'));
  if (!htmlEntry) {
    throw new Error('zip 안에서 .html 파일을 찾을 수 없습니다.');
  }

  const imageEntries = entries.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name));
  const images: Record<string, string> = {};
  for (const entry of imageEntries) {
    const blob = await entry.async('blob');
    const url = URL.createObjectURL(blob);
    // Notion references images by their path relative to the html file (often "<page>/image.png")
    images[entry.name] = url;
    images[entry.name.split('/').pop() as string] = url;
  }

  const rawHtml = await htmlEntry.async('text');
  const doc = buildDocument(rawHtml, images);

  // rewrite relative image src/href to the extracted blob URLs
  const container = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (/^https?:\/\//i.test(src) || src.startsWith('blob:') || src.startsWith('data:')) return;
    const decoded = decodeURIComponent(src);
    const mapped = images[decoded] ?? images[decoded.split('/').pop() as string];
    if (mapped) img.setAttribute('src', mapped);
  });
  container.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (/^https?:\/\/|^mailto:/i.test(href) || href.startsWith('blob:')) return;
    const decoded = decodeURIComponent(href);
    const mapped = images[decoded] ?? images[decoded.split('/').pop() as string];
    if (mapped) a.setAttribute('href', mapped);
  });

  doc.bodyHtml = container.body.firstElementChild?.innerHTML ?? doc.bodyHtml;
  return doc;
}

export async function parseUploadedFile(file: File): Promise<NotionDocument> {
  if (file.name.toLowerCase().endsWith('.zip')) return parseZipFile(file);
  return parseHtmlFile(file);
}
