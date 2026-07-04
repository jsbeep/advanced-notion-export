import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../state/store';
import { detectBlockType } from '../core/blockRegistry';
import type { StyleOverride } from '../core/types';

function parsePx(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="anx-field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const delta = e.key === 'ArrowUp' ? step : -step;
            onChange(value + delta);
          }
        }}
      />
    </label>
  );
}

/** Reads the block's actual rendered style (from the live preview iframe) as the inspector's starting baseline. */
function readComputedDefaults(
  iframe: HTMLIFrameElement | null,
  blockId: string | null
): StyleOverride {
  if (!iframe || !blockId) return {};
  const idoc = iframe.contentDocument;
  const el = idoc?.getElementById(blockId);
  const view = idoc?.defaultView;
  if (!el || !view) return {};
  const cs = view.getComputedStyle(el);
  const firstItem = el.querySelector(':scope > li');
  const listGap = firstItem ? view.getComputedStyle(firstItem).marginBottom : undefined;
  return {
    width: cs.width,
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
    marginTop: cs.marginTop,
    marginBottom: cs.marginBottom,
    fontSize: cs.fontSize,
    listGap,
  };
}

const LIST_BLOCK_TYPES = new Set(['bulleted-list', 'numbered-list', 'todo']);

export function Inspector() {
  const doc = useAppStore((s) => s.doc);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);
  const overrides = useAppStore((s) => s.overrides);
  const tistoryImageText = useAppStore((s) => s.tistoryImageText);
  const setTistoryImageText = useAppStore((s) => s.setTistoryImageText);
  const setOverride = useAppStore((s) => s.setOverride);
  const clearOverride = useAppStore((s) => s.clearOverride);
  const applyOverrideToSameType = useAppStore((s) => s.applyOverrideToSameType);
  const deleteBlock = useAppStore((s) => s.deleteBlock);
  const previewIframeEl = useAppStore((s) => s.previewIframeEl);

  const [baseDefaults, setBaseDefaults] = useState<StyleOverride>({});
  // Off (default): edits apply to every block of the same type. On: edits stay on this block only.
  const [scopeToBlock, setScopeToBlock] = useState(false);

  useEffect(() => {
    setBaseDefaults(readComputedDefaults(previewIframeEl, selectedBlockId));
  }, [previewIframeEl, selectedBlockId]);

  const blockType = useMemo(() => {
    if (!doc || !selectedBlockId) return null;
    const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');
    const el = parsed.getElementById(selectedBlockId);
    return el ? detectBlockType(el) : null;
  }, [doc, selectedBlockId]);

  if (!selectedBlockId) {
    return (
      <aside className="anx-inspector">
        <p className="anx-inspector-empty">미리보기에서 블록을 클릭해 선택하세요.</p>
      </aside>
    );
  }

  const override: StyleOverride = overrides[selectedBlockId] ?? {};
  const update = (patch: Partial<StyleOverride>) =>
    scopeToBlock
      ? setOverride(selectedBlockId, patch)
      : applyOverrideToSameType(selectedBlockId, patch);
  const effective = (key: keyof StyleOverride) => override[key] ?? baseDefaults[key];

  return (
    <aside className="anx-inspector">
      <div className="anx-inspector-header">
        <span className="anx-badge">{blockType}</span>
        <button
          className="anx-link-btn"
          onClick={() => {
            clearOverride(selectedBlockId);
            setBaseDefaults(readComputedDefaults(previewIframeEl, selectedBlockId));
          }}
        >
          초기화
        </button>
      </div>

      <NumberField
        label="최대 너비 (px, 화면이 좁으면 자동 축소)"
        value={parsePx(effective('width'))}
        onChange={(v) => update({ width: `${v}px` })}
      />

      <div className="anx-field">
        <span>정렬</span>
        <div className="anx-btn-row">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              className={override.align === a ? 'anx-btn active' : 'anx-btn'}
              onClick={() => update({ align: a })}
            >
              {a === 'left' ? '왼쪽' : a === 'center' ? '가운데' : '오른쪽'}
            </button>
          ))}
        </div>
      </div>

      <NumberField
        label="글자 크기 (px)"
        value={parsePx(effective('fontSize'))}
        onChange={(v) => update({ fontSize: `${v}px` })}
      />

      <div className="anx-field-group">
        <span className="anx-field-group-label">패딩 (px)</span>
        <div className="anx-grid-2">
          <NumberField label="위" value={parsePx(effective('paddingTop'))} onChange={(v) => update({ paddingTop: `${v}px` })} />
          <NumberField label="아래" value={parsePx(effective('paddingBottom'))} onChange={(v) => update({ paddingBottom: `${v}px` })} />
          <NumberField label="왼쪽" value={parsePx(effective('paddingLeft'))} onChange={(v) => update({ paddingLeft: `${v}px` })} />
          <NumberField label="오른쪽" value={parsePx(effective('paddingRight'))} onChange={(v) => update({ paddingRight: `${v}px` })} />
        </div>
      </div>

      <div className="anx-field-group">
        <span className="anx-field-group-label">마진 (px)</span>
        <div className="anx-grid-2">
          <NumberField label="위" value={parsePx(effective('marginTop'))} onChange={(v) => update({ marginTop: `${v}px` })} />
          <NumberField label="아래" value={parsePx(effective('marginBottom'))} onChange={(v) => update({ marginBottom: `${v}px` })} />
        </div>
      </div>

      {blockType && LIST_BLOCK_TYPES.has(blockType) && (
        <NumberField
          label="리스트 항목 간격 (px)"
          value={parsePx(effective('listGap'))}
          onChange={(v) => update({ listGap: `${v}px` })}
        />
      )}

      <button
        className={`anx-btn anx-apply-all${scopeToBlock ? ' active' : ''}`}
        aria-pressed={scopeToBlock}
        onClick={() => setScopeToBlock((v) => !v)}
        title="켜면 이 블록에만, 끄면 같은 타입 블록 전체에 적용됩니다"
      >
        이 블록만 적용 {scopeToBlock ? '· ON' : '· OFF'}
      </button>
      <p className="anx-hint">
        {scopeToBlock
          ? '변경사항이 선택한 블록에만 적용됩니다.'
          : '변경사항이 같은 타입 블록 전체에 적용됩니다.'}
      </p>

      {blockType === 'image' && (
        <>
          <p className="anx-hint">이미지 블록 선택 후 Ctrl+V로 클립보드 이미지를 붙여넣으면 교체됩니다.</p>
          <label className="anx-field">
            <span>Tistory 대체 텍스트</span>
            <textarea
              className="anx-textarea"
              rows={3}
              placeholder="[##_Image|...|_##] 등 Tistory 이미지 매크로 / 대체 텍스트"
              value={tistoryImageText[selectedBlockId] ?? ''}
              onChange={(e) => setTistoryImageText(selectedBlockId, e.target.value)}
            />
          </label>
          <p className="anx-hint">
            &lsquo;Tistory 직접 첨부용 표시&rsquo;로 내보낼 때, 이 이미지 자리를 위 텍스트로 대체합니다. (비우면 기본 표시 박스)
          </p>
        </>
      )}

      <button
        className="anx-btn danger anx-apply-all"
        onClick={() => {
          if (window.confirm('이 블록을 삭제할까요? 되돌릴 수 없습니다.')) {
            deleteBlock(selectedBlockId);
          }
        }}
      >
        블록 삭제
      </button>
    </aside>
  );
}
