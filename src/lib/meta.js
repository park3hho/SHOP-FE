// 화면마다 브라우저 제목 · 검색 설명 바꾸기 (2026-11-18) — 구글은 화면을 그린 뒤의 제목을 검색 결과에 쓴다.
//   떠나면 index.html 기본값으로 되돌린다.
const BASE_TITLE = 'EIDOFOOD 이도식품 | 해외 음료 큐레이션'
const descEl = () => document.querySelector('meta[name="description"]')
const BASE_DESC = descEl()?.getAttribute('content') || ''

export function setMeta(title, desc) {
  document.title = title ? `${title} | EIDOFOOD 이도식품` : BASE_TITLE
  descEl()?.setAttribute('content', desc || BASE_DESC)
}
