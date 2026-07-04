import { useCallback, useRef, useState } from 'react';
import { parseUploadedFile } from '../core/parser';
import { useAppStore } from '../state/store';

export function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadDocument = useAppStore((s) => s.loadDocument);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const doc = await parseUploadedFile(file);
        loadDocument(doc);
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일을 읽는 중 오류가 발생했습니다.');
      }
    },
    [loadDocument]
  );

  return (
    <div
      className={dragging ? 'anx-dropzone dragging' : 'anx-dropzone'}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".html,.zip"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <p className="anx-dropzone-title">노션 export 파일을 드래그하거나 클릭해서 업로드하세요</p>
      <p className="anx-dropzone-sub">.html 단일 파일 또는 이미지가 포함된 .zip</p>
      {error && <p className="anx-dropzone-error">{error}</p>}
    </div>
  );
}
