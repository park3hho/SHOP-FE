// 화면마다 브라우저 제목 · 검색 설명 바꾸기 (2026-11-18) — 구글은 화면을 그린 뒤의 제목을 검색 결과에 쓴다.
//   떠나면 index.html 기본값으로 되돌린다.
const BASE_TITLE = 'EIDOFOOD 이도식품 | 해외 음료 큐레이션'
const descEl = () => document.querySelector('meta[name="description"]')
const BASE_DESC = descEl()?.getAttribute('content') || ''

export function setMeta(title, desc) {
  document.title = title ? `${title} | EIDOFOOD 이도식품` : BASE_TITLE
  descEl()?.setAttribute('content', desc || BASE_DESC)
}

// 대표 주소(canonical) · 공유 주소(og:url) — 화면마다 그 주소로 (2026-11-18).
//   예전엔 index.html 의 canonical 이 모든 화면에서 첫 화면이라, 구글이 상품 페이지를 첫 화면의 사본으로 볼 수 있었다.
//   목록은 분류(cat · sub)만 남기고 page · q 등은 뺀다.
const SITE = 'https://www.eidofood.com'
export function setCanonical(path, query) {
  const keep = new URLSearchParams()
  if (path === '/products' && query) for (const k of ['cat', 'sub', 'form']) if (query.get(k)) keep.set(k, query.get(k))
  const href = `${SITE}${path}${keep.size ? `?${keep}` : ''}`
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', href)
}
