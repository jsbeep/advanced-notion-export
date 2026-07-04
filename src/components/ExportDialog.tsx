import { useState } from 'react';
import { useAppStore } from '../state/store';
import { exportFullHtml } from '../core/exporter/exportFull';
import { exportDivHtml } from '../core/exporter/exportDiv';
import type { ImageStrategy } from '../core/types';

const IMAGE_STRATEGIES: { value: ImageStrategy; label: string; hint: string }[] = [
  { value: 'base64', label: 'base64 인라인', hint: '한 파일로 완결되지만 용량이 커집니다.' },
  { value: 'url', label: '외부 URL 유지', hint: '원본이 외부 URL인 이미지만 유지, 나머지는 base64로 대체됩니다.' },
  {
    value: 'placeholder',
    label: 'Tistory 직접 첨부용 표시',
    hint: '이미지 자리에 검색 가능한 표시를 남기고, Tistory 에디터에서 직접 첨부하세요.\n 검색: "이미지 자리"',
  },
];

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useAppStore((s) => s.doc);
  const overrides = useAppStore((s) => s.overrides);
  const tistoryImageText = useAppStore((s) => s.tistoryImageText);
  const exportMode = useAppStore((s) => s.exportMode);
  const setExportMode = useAppStore((s) => s.setExportMode);
  const imageStrategy = useAppStore((s) => s.imageStrategy);
  const setImageStrategy = useAppStore((s) => s.setImageStrategy);

  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const generate = async () => {
    setBusy(true);
    setCopied(false);
    try {
      const html =
        exportMode === 'full'
          ? await exportFullHtml(doc, overrides, imageStrategy, tistoryImageText)
          : await exportDivHtml(doc, overrides, imageStrategy, tistoryImageText);
      setOutput(html);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'export'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  return (
    <div className="anx-modal-backdrop" onClick={onClose}>
      <div className="anx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="anx-modal-header">
          <h2>내보내기 설정</h2>
          <button className="anx-link-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="anx-field">
          <span>내보내기 형식</span>
          <div className="anx-btn-row">
            <button
              className={exportMode === 'full' ? 'anx-btn active' : 'anx-btn'}
              onClick={() => setExportMode('full')}
            >
              완전한 &lt;html&gt; 문서
            </button>
            <button
              className={exportMode === 'div' ? 'anx-btn active' : 'anx-btn'}
              onClick={() => setExportMode('div')}
            >
              반응형 &lt;div&gt; 컴포넌트
            </button>
          </div>
        </div>

        <div className="anx-field">
          <span>이미지 처리 방식</span>
          <div className="anx-radio-list">
            {IMAGE_STRATEGIES.map((s) => (
              <label key={s.value} className="anx-radio">
                <input
                  type="radio"
                  name="image-strategy"
                  checked={imageStrategy === s.value}
                  onChange={() => setImageStrategy(s.value)}
                />
                <span>
                  <strong>{s.label}</strong>
                  <span>{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button className="anx-btn primary" onClick={generate} disabled={busy}>
          {busy ? '생성 중…' : '내보내기 HTML 생성'}
        </button>

        {output && (
          <>
            <textarea className="anx-export-output" readOnly value={output} rows={10} />
            <div className="anx-btn-row">
              <button className="anx-btn" onClick={copy}>
                {copied ? '복사됨!' : '클립보드 복사'}
              </button>
              <button className="anx-btn" onClick={download}>
                .html 다운로드
              </button>
            </div>
            <p className="anx-hint">용량: {(new Blob([output]).size / 1024).toFixed(1)} KB</p>
          </>
        )}
      </div>
    </div>
  );
}
