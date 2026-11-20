// 방문 기록 — 자사 분석도구 (2026-11-15). 받는 곳: SHOP-BE POST /track → AGC 판매 › 자사몰 분석
// 개인정보는 보내지 않는다. 방문자 id = 이 브라우저에서 만든 무작위 값 (localStorage), 세션 = 30분 쉬면 새로.
// navigator.sendBeacon 으로 보내 화면 이동 · 창 닫기와 상관없이 가고, 실패해도 화면에는 영향이 없다.

const URL_ = '/api/shop/track'
const V_KEY = 'shop.vid'
const S_KEY = 'shop.sid'
const IDLE_MS = 30 * 60 * 1000
// 직원 기기 (2026-11-20) — 우리 휴대폰·PC 는 방문 기록을 아예 보내지 않는다 (로그인 안 해도 손님 수에서 빠지게).
//   켜기: 그 기기에서 https://www.eidofood.com/?eido_staff=1 한 번 열기 · 끄기: ?eido_staff=0
const STAFF_KEY = 'shop.staff'
const STAFF_PARAM = 'eido_staff'

function isStaff() {
  try {
    const q = new URLSearchParams(window.location.search).get(STAFF_PARAM)
    if (q === '1') localStorage.setItem(STAFF_KEY, '1')
    else if (q === '0') localStorage.removeItem(STAFF_KEY)
    return localStorage.getItem(STAFF_KEY) === '1'
  } catch {
    return false
  }
}

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

const store = (s, k, v) => {
  try {
    if (v === undefined) return s.getItem(k)
    s.setItem(k, v)
  } catch {
    /* 저장 못 해도 보낸다 */
  }
  return v
}

function visitor() {
  return store(localStorage, V_KEY) || store(localStorage, V_KEY, uid())
}

// { id, at, utm, ref, fresh } — 30분 넘게 쉬었거나 광고 링크(utm)로 새로 들어오면 새 세션
function session() {
  const now = Date.now()
  const q = new URLSearchParams(window.location.search)
  const utm = {
    source: q.get('utm_source') || undefined,
    medium: q.get('utm_medium') || undefined,
    campaign: q.get('utm_campaign') || undefined,
  }
  let s = null
  try {
    s = JSON.parse(store(localStorage, S_KEY) || 'null')
  } catch {
    s = null
  }
  const fresh = !s || now - s.at > IDLE_MS || (utm.source && utm.source !== s.utm?.source)
  if (fresh) s = { id: uid(), utm: utm.source ? utm : {}, ref: document.referrer || '' }
  s.at = now
  store(localStorage, S_KEY, JSON.stringify(s))
  return { ...s, fresh }
}

function send(body) {
  const data = JSON.stringify(body)
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([data], { type: 'text/plain' }))) return
  } catch {
    /* 아래로 */
  }
  fetch(URL_, { method: 'POST', body: data, keepalive: true, credentials: 'same-origin' }).catch(() => {})
}

// type: page_view · product_view · add_to_cart · begin_checkout · purchase
export function track(type, extra = {}) {
  if (typeof window === 'undefined') return
  if (isStaff()) return
  const s = session()
  send({
    t: type,
    v: visitor(),
    s: s.id,
    p: window.location.pathname + window.location.search.replace(/[?&](token|code|state)=[^&]*/g, ''),
    landing: s.fresh && type === 'page_view',
    ref: s.fresh ? s.ref : undefined,
    utm: s.utm,
    ...extra,
  })
}

// 같은 주소를 연달아 두 번 세지 않게 (다시 그리기 · StrictMode)
let lastPage = ''
export function trackPage(path) {
  if (path === lastPage) return
  lastPage = path
  track('page_view')
}
