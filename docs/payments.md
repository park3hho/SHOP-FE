# 자사몰 결제 연동 (카카오페이 · 네이버페이) — FE 가 할 일

> 만든 날 2026-10-27. 서버: SHOP-BE (`C:\Users\iwill\SHOP\BE`, `https://api.eidofood.com/shop`). 지금은 **테스트 결제**(실제 출금 없음), 상품은 시험용 `TEST-10` 10원 하나.

## 0. 이미 준비된 것

| 할 일 | 상태 |
|---|---|
| 결제 서버 (주문 · 준비 · 승인 · 취소 · 기록) | ✅ `api.eidofood.com/shop` |
| 금액 위조 막기 (서버 계산 · 승인 응답 검사 · 다르면 자동 전체 취소) | ✅ |
| FE → 서버 주소 | ✅ `vercel.json` `/api/shop/*` → 서버 · 개발은 `vite.config.js` proxy (포트 5175) |
| FE 함수 | ✅ `src/lib/payments.js` — **화면은 이 함수만 부르면 된다** |
| 테스트 키 | ⏳ 카카오페이 Secret key(dev) · 네이버페이 개발 인증값 — 서버 `.env` 에 넣으면 `getPayConfig()` 의 `enabled` 가 true |
| 실제 결제 (가맹) | ⏳ 나중에 — 사업자 · 통신판매업 · 약관/환불정책 페이지 필요 |

## 1. FE 가 만들 화면 (5개)

| 경로 | 하는 일 | 부르는 함수 |
|---|---|---|
| 주문서 (아무 경로) | 결제 버튼 2개. `getPayConfig()` 로 `enabled` 인 것만 보이기 | `createOrder([{sku, qty}])` → `payWithKakao(code)` 또는 `payWithNaver(code)` |
| `/pay/kakao/approve` | 쿼리 `order` · `pg_token` 으로 승인 → 완료 화면 | `approveKakao(order, pg_token)` |
| `/pay/kakao/cancel` · `/pay/kakao/fail` | 취소/실패 안내 + 다시 결제 | `reportReturn(order, 'kakao', 'cancel' \| 'fail')` |
| `/pay/naver/return` | `resultCode === 'Success'` 면 승인, 아니면 안내 | `approveNaver(order, paymentId)` / `reportReturn(order, 'naver', resultCode, resultMessage)` |
| 주문 완료 | 결과 보여 주기 | `getOrder(code)` |

**경로 이름은 바꾸지 않는다** — 서버가 결제사에 이 주소를 돌아올 곳으로 알려 준다 (`core/pay_config.py`).
`vercel.json` 의 SPA rewrite 가 있어서 이 경로들은 새로고침해도 `index.html` 로 열린다. 지금 앱에 라우터가 없으면 `window.location.pathname` 으로 나눠도 된다.

```jsx
import { createOrder, getPayConfig, payWithKakao, payWithNaver, approveKakao, approveNaver, reportReturn } from './lib/payments'

// 주문서 — 버튼
const order = await createOrder([{ sku: 'TEST-10', qty: 1 }])   // 금액은 서버가 계산 (order.total_amount)
await payWithKakao(order.code)      // 카카오 결제창으로 이동
await payWithNaver(order.code)      // 네이버 결제창 열기 (SDK 는 함수가 알아서 불러옴)

// /pay/kakao/approve
const q = new URLSearchParams(location.search)
const done = await approveKakao(q.get('order'), q.get('pg_token'))   // done.status === 'paid'

// /pay/naver/return
if (q.get('resultCode') === 'Success') await approveNaver(q.get('order'), q.get('paymentId'))
else await reportReturn(q.get('order'), 'naver', q.get('resultCode'), q.get('resultMessage'))
```

## 2. 함수 (`src/lib/payments.js`)

| 함수 | 돌려주는 값 | 메모 |
|---|---|---|
| `getProducts()` | `[{sku, name, price, max_qty}]` | 지금은 `TEST-10` 10원 |
| `getPayConfig()` | `{kakao:{enabled,test}, naver:{enabled,test,mode,client_id,chain_id,sdk_url}}` | 키가 없으면 `enabled:false` — 버튼 숨기기 |
| `createOrder(items)` | `order` | token 은 localStorage `shop.order.{code}` 에 저장 (화면은 몰라도 됨) |
| `getOrder(code)` | `order` | 같은 브라우저에서만 |
| `payWithKakao(code, {mobile})` | — (페이지 이동) | PC 는 QR/카톡 결제창, 휴대폰은 카카오톡으로 넘어감 |
| `approveKakao(code, pgToken)` | `order` | 두 번 불러도 한 번만 승인 |
| `payWithNaver(code)` | — (페이지 이동) | 네이버 로그인이 안 돼 있으면 네이버가 로그인으로 보냄 |
| `approveNaver(code, paymentId)` | `order` | 결제창 인증 후 **10분 안에** 불러야 함 |
| `reportReturn(code, provider, result, message)` | `order` | 주문을 다시 결제할 수 있게 `pending` 으로 |
| `cancelTestPayment(code)` | `order` | 테스트 서버에서만 (운영은 관리자 화면) |

오류는 `Error.message` 에 사용자에게 보여 줄 한국어 문장이 들어 있다 (예: "이미 결제된 주문이에요.", 결제사 실패 사유).

`order` 모양: `{ code, status, items:[{sku,name,unit_price,qty,amount}], item_name, quantity, total_amount, tax_free_amount, provider, pay_method, test, paid_at, cancelled_at, fail_reason, created_at }`
`status`: `pending`(주문만) → `paying`(결제창 열림) → `paid` · `failed` · `cancelled`.

## 3. 서버 API (함수 안쪽 — 직접 부를 일은 거의 없음)

기준 주소 `/api/shop` (= `https://api.eidofood.com/shop`). 응답은 `{"status":"success", …}`, 오류는 `{"detail": "문장"}`.

| Method | Path | Body → 응답 |
|---|---|---|
| GET | `/products` | → `items` |
| GET | `/payments/config` | → `kakao`, `naver` |
| POST | `/orders` | `{items:[{sku,qty}]}` → `order`, `token` |
| POST | `/orders/lookup` | `{code, token}` → `order` |
| POST | `/payments/kakao/ready` | `{code, token, return_origin?}` → `redirect_pc`, `redirect_mobile`, `redirect_app` |
| POST | `/payments/kakao/approve` | `{code, token, pg_token}` → `order` |
| POST | `/payments/naver/reserve` | `{code, token, return_origin?}` → `sdk` (create 값), `open` (oPay.open 값) |
| POST | `/payments/naver/approve` | `{code, token, payment_id}` → `order` |
| POST | `/payments/return` | `{code, token, provider, result, message?}` → `order` |
| POST | `/payments/cancel` | `{code, token, reason?}` → `order` (dev 만) |

- `return_origin`: 결제 후 돌아올 사이트. 허용 목록(`https://www.eidofood.com` · `https://eidofood.com` · `https://eido-shop.vercel.app` · `http://localhost:5175`) 밖이면 `https://www.eidofood.com`.
- 오류 코드: 400 입력 · 404 주문 없음(또는 token 틀림) · 409 이미 결제/상태 안 맞음/금액 불일치 자동 취소 · 502 결제사 실패 · 503 테스트 키 없음.

## 4. 테스트하는 법

- **카카오페이**: 결제창은 목업이라 비밀번호 없이 진행된다 (실제 출금 없음). PC 는 QR 대신 화면 안내를 따라가면 된다.
- **네이버페이**: 개발 환경 결제창. 내 네이버 계정에 개발 환경 동의 후 카드·계좌를 등록해 쓴다 (실제 출금 없음). 테스트 포인트는 개발자센터 › 결제 연동 체험하기 › 테스트용 포인트 받기.
- 결제 후 `cancelTestPayment(code)` 로 되돌릴 수 있다.
- 서버 기록: `shop.payment_event` (준비·승인·취소·검증 실패마다 1줄, 원본은 암호화).

## 5. 실제 결제로 바꿀 때 (나중)

1. 카카오페이 가맹 신청(biz.kakaopay.com) → 실제 CID · Secret key(운영) / 네이버페이 결제형 가맹 → 운영 인증값
2. 서버 `.env`: `KAKAOPAY_CID`, `KAKAOPAY_SECRET_KEY`, `NAVERPAY_MODE=production`, `NAVERPAY_*`, `ENV=prod` (테스트 취소 막힘)
3. 상품을 AGC 상품·가격으로 (`SHOP-BE services/catalog.py`)
4. FE 는 바꿀 것 없음
