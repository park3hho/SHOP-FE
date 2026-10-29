import { useEffect, useState } from 'react'

import {
  approveKakao,
  approveNaver,
  cancelTestPayment,
  createOrder,
  getOrder,
  getPayConfig,
  payWithKakao,
  payWithNaver,
  reportReturn,
} from '../lib/payments'
import './pay.css'

// 결제 화면 — /pay/… 경로 (main.jsx 가 나눈다). 설명서: docs/payments.md
//   /pay/test            시험 결제 (10원 상품, 테스트 키 — 실제 출금 없음)
//   /pay/kakao/approve   카카오 결제 후 → 승인
//   /pay/kakao/cancel · /pay/kakao/fail
//   /pay/naver/return    네이버 결제 후 → 승인 (resultCode=Success) 또는 안내
//   /pay/done?order=     결과

const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`
const STATUS = { pending: '결제 전', paying: '결제 중', paid: '결제 완료', cancelled: '취소됨', failed: '실패' }

function Shell({ title, children }) {
  return (
    <div className="pay">
      <a className="pay-logo" href="/">EIDO</a>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

function OrderBox({ order }) {
  if (!order) return null
  return (
    <dl className="pay-order">
      <dt>주문</dt>
      <dd>{order.code}</dd>
      <dt>상품</dt>
      <dd>
        {order.item_name} ×{order.quantity}
      </dd>
      <dt>금액</dt>
      <dd>{won(order.total_amount)}</dd>
      <dt>상태</dt>
      <dd className={`st-${order.status}`}>
        {STATUS[order.status] || order.status}
        {order.provider ? ` · ${order.provider === 'kakao' ? '카카오페이' : '네이버페이'}` : ''}
        {order.test ? ' · 테스트' : ''}
      </dd>
    </dl>
  )
}

function TestPage() {
  const [cfg, setCfg] = useState(null)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getPayConfig()
      .then(setCfg)
      .catch((e) => setError(e.message))
  }, [])

  const pay = async (provider) => {
    setBusy(provider)
    setError('')
    try {
      const order = await createOrder([{ sku: 'TEST-10', qty }])
      if (provider === 'kakao') await payWithKakao(order.code)
      else await payWithNaver(order.code)
    } catch (e) {
      setError(e.message)
      setBusy('')
    }
  }

  return (
    <Shell title="결제 시험">
      <p className="pay-sub">10원 시험 상품 · 테스트 결제라 실제로 돈이 나가지 않아요.</p>
      <label className="pay-qty">
        수량
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}개 · {won(10 * n)}
            </option>
          ))}
        </select>
      </label>
      <div className="pay-buttons">
        <button
          className="pay-btn kakao"
          disabled={!cfg?.kakao.enabled || !!busy}
          onClick={() => pay('kakao')}
        >
          {busy === 'kakao' ? '여는 중…' : '카카오페이로 결제'}
        </button>
        <button
          className="pay-btn naver"
          disabled={!cfg?.naver.enabled || !!busy}
          onClick={() => pay('naver')}
        >
          {busy === 'naver' ? '여는 중…' : '네이버페이로 결제'}
        </button>
      </div>
      {cfg && (!cfg.kakao.enabled || !cfg.naver.enabled) && (
        <p className="pay-note">테스트 키가 없는 결제수단은 잠겨 있어요.</p>
      )}
      {error && <p className="pay-error">{error}</p>}
    </Shell>
  )
}

// 결제사에서 돌아온 화면 — 한 번만 처리하고 결과 화면으로
function ReturnPage({ provider, kind }) {
  const q = new URLSearchParams(window.location.search)
  const code = q.get('order')
  const [order, setOrder] = useState(null)
  const [msg, setMsg] = useState('확인하는 중…')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) {
      setError('주문 번호가 없어요')
      return
    }
    const run = async () => {
      // 실제 상품 주문(회원)은 승인 뒤 주문 완료 화면으로
      const done = (o) => {
        if (o.items.some((i) => !i.sku.startsWith('TEST-'))) {
          window.location.replace(`/order/complete?order=${encodeURIComponent(o.code)}`)
          return
        }
        setOrder(o)
        setMsg('결제가 완료됐어요')
      }
      if (provider === 'kakao' && kind === 'approve') {
        done(await approveKakao(code, q.get('pg_token')))
      } else if (provider === 'naver' && q.get('resultCode') === 'Success') {
        done(await approveNaver(code, q.get('paymentId')))
      } else {
        const result = provider === 'naver' ? q.get('resultCode') || 'fail' : kind
        const message = q.get('resultMessage') || ''
        setOrder(await reportReturn(code, provider, result, message))
        setMsg(
          result === 'cancel' || result === 'UserCancel'
            ? '결제를 취소했어요'
            : `결제가 되지 않았어요${message ? ` — ${message}` : ''}`,
        )
      }
    }
    run().catch(async (e) => {
      setError(e.message)
      setOrder(await getOrder(code).catch(() => null))
    })
    // 한 번만 — 새로고침해도 서버가 같은 주문을 두 번 승인하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Shell title={error ? '결제를 확인하지 못했어요' : msg}>
      <OrderBox order={order} />
      {error && <p className="pay-error">{error}</p>}
      <Actions order={order} onChange={setOrder} />
    </Shell>
  )
}

function DonePage() {
  const code = new URLSearchParams(window.location.search).get('order')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    getOrder(code)
      .then(setOrder)
      .catch((e) => setError(e.message))
  }, [code])
  return (
    <Shell title="주문 확인">
      <OrderBox order={order} />
      {error && <p className="pay-error">{error}</p>}
      <Actions order={order} onChange={setOrder} />
    </Shell>
  )
}

function Actions({ order, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <>
      <div className="pay-links">
        {order?.status === 'paid' && order.test && (
          <button
            className="pay-link"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                onChange(await cancelTestPayment(order.code))
              } catch (e) {
                setError(e.message)
              }
              setBusy(false)
            }}
          >
            {busy ? '취소 중…' : '테스트 결제 취소'}
          </button>
        )}
        {order && order.items.some((i) => !i.sku.startsWith('TEST-')) ? (
          order.status !== 'paid' && (
            <a className="pay-link" href="/order/checkout">
              주문서로 돌아가기
            </a>
          )
        ) : (
          <a className="pay-link" href="/pay/test">
            결제 시험으로
          </a>
        )}
        <a className="pay-link" href="/">
          홈으로
        </a>
      </div>
      {error && <p className="pay-error">{error}</p>}
    </>
  )
}

export default function PayPages() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path === '/pay/kakao/approve') return <ReturnPage provider="kakao" kind="approve" />
  if (path === '/pay/kakao/cancel') return <ReturnPage provider="kakao" kind="cancel" />
  if (path === '/pay/kakao/fail') return <ReturnPage provider="kakao" kind="fail" />
  if (path === '/pay/naver/return') return <ReturnPage provider="naver" kind="return" />
  if (path === '/pay/done') return <DonePage />
  return <TestPage />
}
