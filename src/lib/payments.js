// 자사몰 결제 — 서버(SHOP-BE)와 주고받는 함수 모음. 화면(버튼·결과 페이지)은 이 함수만 부르면 된다.
// 설명서: docs/payments.md
//
// 주소: 같은 출처 /api/shop/… → Vercel rewrite → https://api.eidofood.com/shop/… (개발 중엔 vite proxy)
// 금액은 보내지 않는다 — 서버가 상품 가격으로 계산하고, 승인 때 다시 검사한다.
// 주문의 code · token 은 이 브라우저 localStorage 에 둔다 (결제창 갔다 돌아와도 이어서 승인하려고).

const API = '/api/shop'
const KEY = (code) => `shop.order.${code}`

async function call(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(typeof data.detail === 'string' ? data.detail : '결제 서버 요청에 실패했어요')
    err.status = res.status
    throw err
  }
  return data
}

// 이 주문의 code · token (주문을 만든 브라우저에만 있음)
const ref = (code) => {
  const token = localStorage.getItem(KEY(code))
  if (!token) throw new Error('이 브라우저에서 만든 주문이 아니에요')
  return { code, token }
}
// 결제 후 돌아올 주소 — 지금 사이트 (서버 허용 목록에 없으면 서버가 www.eidofood.com 으로 바꾼다)
const origin = () => window.location.origin

// ── 상품 · 주문 ───────────────────────────────────────────

/** 판매 상품 (지금은 시험용 TEST-10 · 10원) → [{ sku, name, price, max_qty }] */
export const getProducts = async () => (await call('/products')).items

/** 쓸 수 있는 결제수단 → { kakao, naver, card: { enabled, test } (신용·체크카드 = 포트원 · KCP) } */
export const getPayConfig = async () => {
  const { kakao, naver, card } = await call('/payments/config')
  return { kakao, naver, card: card || { enabled: false, test: true } }
}

/** 주문 만들기 — items: [{ sku, qty }] → order { code, total_amount, status, … }
 *  실제 상품(회원)은 extra 에 { shipping:{name,phone,zip,addr1,addr2}, pccc, memo, agree:true, save_address, save_pccc } */
export const createOrder = async (items, extra = {}) => {
  const { order, token } = await call('/orders', { items, ...extra })
  localStorage.setItem(KEY(order.code), token)
  return order
}

/** 주문 다시 읽기 (결과 화면) → order */
export const getOrder = async (code) => (await call('/orders/lookup', ref(code))).order

// ── 카카오페이 ─────────────────────────────────────────────
// 흐름: payWithKakao(code) → 카카오 결제창 → /pay/kakao/approve?order=…&pg_token=… 로 돌아옴
//       → 그 화면에서 approveKakao(code, pg_token). 취소·실패면 /pay/kakao/cancel · /fail ?order=… → reportReturn

/** 결제창으로 이동한다 (돌아오지 않음). mobile: 휴대폰 화면이면 true */
export const payWithKakao = async (code, { mobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) } = {}) => {
  const r = await call('/payments/kakao/ready', { ...ref(code), return_origin: origin() })
  window.location.href = mobile ? r.redirect_mobile : r.redirect_pc
}

/** /pay/kakao/approve 화면에서 — 승인 → order (status 'paid') */
export const approveKakao = async (code, pgToken) =>
  (await call('/payments/kakao/approve', { ...ref(code), pg_token: pgToken })).order

// ── 네이버페이 ─────────────────────────────────────────────
// 흐름: payWithNaver(code) → 네이버 결제창 → /pay/naver/return?order=…&resultCode=Success&paymentId=…
//       → 그 화면에서 approveNaver(code, paymentId). resultCode 가 Success 가 아니면 reportReturn

let sdkLoading = null
const loadNaverSdk = (url) =>
  (sdkLoading ??= new Promise((resolve, reject) => {
    if (window.Naver?.Pay) return resolve()
    const s = document.createElement('script')
    s.src = url // 네이버 안내: 반드시 이 주소에서 불러올 것 (내려받아 두지 말 것)
    s.onload = () => resolve()
    s.onerror = () => {
      sdkLoading = null
      reject(new Error('네이버페이 결제창을 불러오지 못했어요'))
    }
    document.head.appendChild(s)
  }))

/** 결제창을 연다 (페이지 이동). 값은 전부 서버가 정한 것 */
export const payWithNaver = async (code) => {
  const { sdk, open } = await call('/payments/naver/reserve', { ...ref(code), return_origin: origin() })
  await loadNaverSdk(sdk.sdk_url)
  const oPay = window.Naver.Pay.create({
    mode: sdk.mode,
    clientId: sdk.client_id,
    ...(sdk.chain_id ? { chainId: sdk.chain_id } : {}),
  })
  oPay.open(open)
}

/** /pay/naver/return 화면에서 (resultCode === 'Success') — 승인 → order (status 'paid') */
export const approveNaver = async (code, paymentId) =>
  (await call('/payments/naver/approve', { ...ref(code), payment_id: paymentId })).order

// ── 카드 (토스페이먼츠 결제창) ──────────────────────────────────
// 흐름: payWithCard(code) → 토스 카드 결제창 → /pay/toss/success?order=…&paymentKey=…&orderId=…&amount=…
//       → 그 화면에서 approveCard(code, paymentKey, amount). 실패·취소면 /pay/toss/fail?order=…&code=…&message=…

let tossLoading = null
const loadTossSdk = (url) =>
  (tossLoading ??= new Promise((resolve, reject) => {
    if (window.TossPayments) return resolve()
    const s = document.createElement('script')
    s.src = url
    s.onload = () => resolve()
    s.onerror = () => {
      tossLoading = null
      reject(new Error('카드 결제창을 불러오지 못했어요'))
    }
    document.head.appendChild(s)
  }))

/** (대기) 토스페이먼츠 카드 결제창 — 지금 주문서는 payWithCard(포트원 · KCP)를 쓴다 */
export const payWithToss = async (code) => {
  const r = await call('/payments/toss/ready', { ...ref(code), return_origin: origin() })
  await loadTossSdk(r.sdk_url)
  const payment = window.TossPayments(r.client_key).payment({ customerKey: r.customer_key })
  try {
    await payment.requestPayment(r.request)
  } catch (e) {
    // PC 결제창을 닫으면 여기로 온다 — 주문을 다시 결제할 수 있게 되돌린다
    await reportReturn(code, 'toss', e?.code === 'USER_CANCEL' ? 'cancel' : 'fail', e?.message).catch(() => {})
    throw new Error(e?.code === 'USER_CANCEL' ? '카드 결제를 취소했어요' : e?.message || '카드 결제창을 열지 못했어요')
  }
}

/** /pay/toss/success 화면에서 — 승인 → order (status 'paid') */
export const approveToss = async (code, paymentKey, amount) =>
  (await call('/payments/toss/approve', { ...ref(code), payment_key: paymentKey, amount: Number(amount) })).order

// ── 신용·체크카드 (포트원 V2 · NHN KCP) — 주문서가 쓰는 것 ───────────────────────────
// 흐름: payWithCard(code) → KCP 결제창
//   PC: 이 함수가 끝날 때 서버 확인까지 해서 order(paid)를 돌려준다
//   휴대폰: /pay/portone/return?order=…&paymentId=…(&code=…) 로 이동 → 그 화면에서 approveCard

let portoneLoading = null
const loadPortone = (url) =>
  (portoneLoading ??= new Promise((resolve, reject) => {
    if (window.PortOne) return resolve()
    const s = document.createElement('script')
    s.src = url
    s.onload = () => resolve()
    s.onerror = () => {
      portoneLoading = null
      reject(new Error('카드 결제창을 불러오지 못했어요'))
    }
    document.head.appendChild(s)
  }))

/** 카드 결제 → (PC) order · (휴대폰) 페이지 이동으로 돌아오지 않음. 값은 전부 서버가 정한 것 */
export const payWithCard = async (code) => {
  const r = await call('/payments/portone/ready', { ...ref(code), return_origin: origin() })
  await loadPortone(r.sdk_url)
  const res = await window.PortOne.requestPayment(r.request)
  if (!res || res.code) {
    const cancel = /CANCEL/i.test(res?.code || '') || /취소/.test(res?.message || '')
    await reportReturn(code, 'portone', cancel ? 'cancel' : 'fail', res?.message).catch(() => {})
    throw new Error(cancel ? '카드 결제를 취소했어요' : res?.message || '카드 결제가 되지 않았어요')
  }
  return approveCard(code, res.paymentId)
}

/** 결제창이 끝난 뒤 — 서버가 포트원에서 직접 확인 → order (status 'paid') */
export const approveCard = async (code, paymentId) =>
  (await call('/payments/portone/approve', { ...ref(code), payment_id: paymentId })).order

// ── 공통 ───────────────────────────────────────────────────

/** 결제창에서 취소·실패로 돌아왔을 때 — 주문을 다시 결제할 수 있게 되돌린다 → order */
export const reportReturn = async (code, provider, result, message) =>
  (await call('/payments/return', { ...ref(code), provider, result, message })).order

/** 테스트 결제 전체 취소 (서버가 dev 일 때만) → order (status 'cancelled') */
export const cancelTestPayment = async (code) =>
  (await call('/payments/cancel', { ...ref(code), reason: '테스트 취소' })).order

/** 다 끝난 주문의 token 을 지운다 (선택) */
export const forgetOrder = (code) => localStorage.removeItem(KEY(code))
