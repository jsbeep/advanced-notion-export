import { useEffect, useState } from 'react';
import { useAppStore } from './state/store';
import { Dropzone } from './components/Dropzone';
import { SampleGallery } from './components/SampleGallery';
import { Preview } from './components/Preview';
import { Inspector } from './components/Inspector';
import { ExportDialog } from './components/ExportDialog';
import { DesignDialog } from './components/DesignDialog';
import { detectBlockType } from './core/blockRegistry';

function App() {
  const doc = useAppStore((s) => s.doc);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);
  const replaceImageSrc = useAppStore((s) => s.replaceImageSrc);
  const clearDocument = useAppStore((s) => s.clearDocument);
  const [exportOpen, setExportOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (!doc || !selectedBlockId) return;
      const parsed = new DOMParser().parseFromString(`<div>${doc.bodyHtml}</div>`, 'text/html');
      const el = parsed.getElementById(selectedBlockId);
      if (!el || detectBlockType(el) !== 'image') return;

      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;

      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => replaceImageSrc(selectedBlockId, reader.result as string);
      reader.readAsDataURL(file);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [doc, selectedBlockId, replaceImageSrc]);

  return (
    <div className="anx-app">
      <header className="anx-toolbar">
        <div className="anx-toolbar-brand">Advanced Notion Export</div>
        <div className="anx-toolbar-actions">
          {doc && (
            <button className="anx-btn" onClick={clearDocument}>
              새 문서 업로드
            </button>
          )}
          <button className="anx-btn" onClick={toggleTheme}>
            {theme === 'light' ? '다크 모드' : '라이트 모드'}
          </button>
          <button className="anx-btn" onClick={() => setDesignOpen(true)}>
            디자인 저장/적용
          </button>
          <button className="anx-btn primary" disabled={!doc} onClick={() => setExportOpen(true)}>
            내보내기
          </button>
        </div>
      </header>

      <main className="anx-main">
        {!doc ? (
          <div className="anx-empty-state">
            <Dropzone />
            <SampleGallery />
          </div>
        ) : (
          <>
            <section className="anx-preview-panel">
              <Preview />
            </section>
            <Inspector />
          </>
        )}
      </main>

      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
      {designOpen && <DesignDialog onClose={() => setDesignOpen(false)} />}
    </div>
  );
}

export default App;
