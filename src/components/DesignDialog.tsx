import { useState } from 'react';
import { useAppStore } from '../state/store';

export function DesignDialog({ onClose }: { onClose: () => void }) {
  const doc = useAppStore((s) => s.doc);
  const savedDesigns = useAppStore((s) => s.savedDesigns);
  const saveDesignFromCurrent = useAppStore((s) => s.saveDesignFromCurrent);
  const applyDesign = useAppStore((s) => s.applyDesign);
  const deleteDesign = useAppStore((s) => s.deleteDesign);

  const [name, setName] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveDesignFromCurrent(trimmed);
    setName('');
  };

  return (
    <div className="anx-modal-backdrop" onClick={onClose}>
      <div className="anx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="anx-modal-header">
          <h2>디자인 저장/적용</h2>
          <button className="anx-link-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="anx-hint">
          현재 블록별 스타일 조정을 블록 타입 기준으로 묶어 저장합니다. 다른 문서를 불러온 뒤에도
          같은 이름의 디자인을 적용하면 콜아웃·코드블록·리스트 등 같은 타입의 블록에 동일한 스타일이
          적용됩니다.
        </p>

        <div className="anx-field">
          <span>현재 디자인 저장</span>
          <div className="anx-btn-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="디자인 이름"
              onKeyDown={(e) => e.key === 'Enter' && save()}
              style={{
                flex: 1,
                padding: '0.45rem 0.6rem',
                border: '1px solid var(--anx-border)',
                borderRadius: 6,
                background: 'var(--anx-bg)',
                color: 'var(--anx-text)',
              }}
            />
            <button className="anx-btn primary" onClick={save} disabled={!doc || !name.trim()}>
              저장
            </button>
          </div>
        </div>

        <div className="anx-field-group">
          <span className="anx-field-group-label">저장된 디자인</span>
          {savedDesigns.length === 0 ? (
            <p className="anx-hint">아직 저장된 디자인이 없습니다.</p>
          ) : (
            <div className="anx-radio-list">
              {savedDesigns.map((d) => (
                <div key={d.id} className="anx-radio" style={{ cursor: 'default' }}>
                  <span style={{ flex: 1 }}>
                    <strong>{d.name}</strong>
                    <br />
                    <small>{new Date(d.createdAt).toLocaleString()}</small>
                  </span>
                  <div className="anx-btn-row">
                    <button className="anx-btn" disabled={!doc} onClick={() => applyDesign(d.id)}>
                      적용
                    </button>
                    <button className="anx-btn" onClick={() => deleteDesign(d.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
