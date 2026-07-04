<div align="center">

# 📤 Advanced Notion Export

**Notion 내보내기 HTML을 블로그(특히 티스토리)에 통째로 붙여넣기 위한 스타일 편집 · 변환 도구**

![status](https://img.shields.io/badge/status-개발중-f59e0b?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white)

</div>

> ⚠️ **개발 중인 프로젝트입니다.** <br>기능과 내보내기 결과 형식이 예고 없이 바뀔 수 있음
<br> 버그·제안 환영합니다 → [문의](#-문의)

---

## 소개

Notion의 **HTML 내보내기**는 그대로 블로그에 붙이면 스타일이 깨지거나, 블로그 테마 CSS와 충돌하거나, 이미지가 사라짐<br>
이 도구는 Notion export HTML을 불러와 **실시간 미리보기로 블록 단위 스타일을 다듬고**, 블로그에 바로 붙일 수 있는 **자기완결형 HTML**로 변환합니다.

notion.so 앱과 최대한 동일한 모양(콜아웃 · 코드 블록 · 북마크 카드 · 토글)을 재현하는 데 초점을 맞췄습니다.

## ✨ 주요 기능

- **업로드** — `.html` 단일 파일 또는 이미지가 포함된 `.zip` 내보내기 지원
- **실시간 미리보기** — iframe 안에서 실제 렌더링을 보며 편집
- **블록 인스펙터** — 미리보기에서 블록을 클릭해 편집
  - 최대 너비 · 정렬 · 글자 크기 · 패딩 · 마진 · 리스트 항목 간격
  - "이 블록만 / 같은 타입 전체" 적용 토글, 블록 삭제
  - 이미지 블록: `Ctrl+V`로 클립보드 이미지 교체, **Tistory 대체 텍스트** 입력
- **notion.so 앱 스타일 재현** — 콜아웃/체크리스트 보정, 복사 버튼 달린 코드 블록 카드, 앱과 동일한 북마크 카드, 토글 마커 회전·펼침 애니메이션
- **디자인 프리셋** — 타입별 스타일을 저장하고 다른 문서에 재적용
- **라이트 / 다크 테마**
- **내보내기 옵션**
  - 형식: 완전한 `<html>` 문서 · 반응형 `<div>` 컴포넌트(블로그 붙여넣기용, CSS 스코프 처리로 블로그 테마와 충돌 방지)
  - 이미지: `base64` 인라인 · 외부 URL 유지 · **Tistory 직접 첨부용 표시**

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📖 사용법

1. Notion 페이지에서 **`···` → 내보내기 → HTML** 로 저장 (이미지가 있으면 `.zip`으로 나옵니다)
2. 이 앱에 `.html` 또는 `.zip`을 드래그해서 업로드
3. 미리보기에서 블록을 클릭 → 인스펙터에서 스타일 조정
4. 우측 상단 **내보내기** → 형식/이미지 방식 선택 → **HTML 생성** → 복사 또는 다운로드
5. 블로그 글쓰기(HTML 모드)에 붙여넣기

### 💡 티스토리 팁

- 붙여넣기는 **반응형 `<div>` 컴포넌트** 형식을 추천합니다. 모든 스타일이 `.anx-export` 아래로 스코프되어 블로그 테마 CSS와 섞이지 않습니다.
- 사실 섞입니다 추가작업 빡셉니다 블로그관리->스킨 편집->HTML 편집->CSS 편집에서 entry-content 클래스/img/p/a 태그 관련 css 뒤에 `:not(.anx-export *)` 붙여야함 <br>
예시: `.entry-content h1 { ... }` -> `.entry-content h1:not(.anx-export *) { ... }`
- 이미지를 티스토리에 직접 올리려면 **`Tistory 직접 첨부용 표시`** 로 내보내세요. 이미지 자리에 표시가 남고, 인스펙터의 **Tistory 대체 텍스트**에 티스토리 이미지 매크로(`[##_Image|...##]`)를 넣어두면 그 자리를 자동으로 채워줍니다.

## 🛠 기술 스택

React 19 · TypeScript · Vite · [Zustand](https://github.com/pmndrs/zustand)(상태·영속화) · [JSZip](https://stuk.github.io/jszip/)(zip 파싱) · Oxlint

## 📬 문의

버그 제보 · 기능 제안 · 사용 중 막히는 점은 아래로 연락 주세요.

- **이메일** — [jsb031597@gmail.com](mailto:jsb031597@gmail.com)
- **GitHub Issues** — 저장소의 Issues 탭에 등록

재현 방법이나 문제의 Notion HTML 일부를 함께 남겨주시면 훨씬 빠르게 도와드릴 수 있어요. 🙌
