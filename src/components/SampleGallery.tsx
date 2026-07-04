import promoExample from '../samples/promo-example.html?raw';
import techBlog from '../samples/tech-blog.html?raw';
import portfolio from '../samples/portfolio.html?raw';
import { buildDocument } from '../core/parser';
import { useAppStore } from '../state/store';

const SAMPLES = [
  { key: 'promo', label: '프로모션 소개 (전체 블록)', html: promoExample },
  { key: 'blog', label: '기술 블로그 (코드 중심)', html: techBlog },
  { key: 'portfolio', label: '포트폴리오 (컬럼·토글)', html: portfolio },
];

export function SampleGallery() {
  const loadDocument = useAppStore((s) => s.loadDocument);

  return (
    <div className="anx-sample-gallery">
      <span className="anx-sample-label">샘플로 시작하기</span>
      <div className="anx-sample-list">
        {SAMPLES.map((sample) => (
          <button
            key={sample.key}
            className="anx-btn"
            onClick={() => loadDocument(buildDocument(sample.html))}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
