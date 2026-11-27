// 플로팅 장바구니 (2026-11-25 사용자 목업 승인) — 오른쪽 아래 검정 버튼: 가방 · 개수 · 합계.
//   담은 상품이 있을 때만 보이고, 장바구니 · 주문서 · 결제 · 로그인 화면에선 숨김.
//   PC: 누르면 위로 미리보기(상품 · 합계 · 주문하기 · 전체 보기). 바깥 · × · Esc 로 닫힘. 수량 변경은 장바구니 화면에서.
//   휴대폰(폭 720px 이하): 누르면 바로 장바구니 화면. 담으면 버튼이 톡 튀고 '장바구니에 담았어요' 1.5초.
import { useEffect, useRef, useState } from 'react'

import { useMember, won } from '../lib/api'
import { removeFromCart, setQty, setBuyNow, useCart } from '../lib/cart'
import { useFreightOn } from '../lib/freight'
import { Link, navigate } from '../lib/router'

const HIDE = [/^\/cart/, /^\/order/, /^\/pay/, /^\/login/, /^\/signup/]
const mobile = () => window.matchMedia('(max-width: 720px)').matches

function Bag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export default function FloatingCart({ path }) {
  const items = useCart()
  const member = useMember()
  const [open, setOpen] = useState(false)
  const [bump, setBump] = useState(false)
  const [toast, setToast] = useState(false)
  const box = useRef(null)
  const count = items.reduce((n, i) => n + (i.qty || 0), 0)
  const total = items.reduce((n, i) => n + (i.price || 0) * (i.qty || 0), 0)
  const prev = useRef(count)
  const f = useFreightOn() ? { on: true } : { on: false } // 배송비 별도 모드인지만 (금액 계산 안 함)

  // 담으면 톡 튀고 안내 1.5초 (다른 탭에서 담아도)
  useEffect(() => {
    if (count > prev.current) {
      setBump(false)
      requestAnimationFrame(() => setBump(true))
      setToast(true)
      const t = setTimeout(() => setToast(false), 1500)
      prev.current = count
      return () => clearTimeout(t)
    }
    prev.current = count
    return undefined
  }, [count])

  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!items.length || HIDE.some((r) => r.test(path))) return null

  const order = () => {
    setBuyNow(items)
    const to = '/order/checkout?buy=cart'
    navigate(member ? to : `/login?next=${encodeURIComponent(to)}`)
  }

  return (
    <div className="fcart" ref={box}>
      {toast && !open && <div className="fcart-toast">장바구니에 담았어요</div>}
      {open && (
        <div className="fcart-panel" role="dialog" aria-label="장바구니 미리보기">
          <div className="fcart-head">
            <b>
              장바구니<span>{count}</span>
            </b>
            <button className="fcart-x" aria-label="닫기" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="fcart-list">
            {items.map((i) => (
              <div key={i.sku} className="fcart-item">
                <Link to={`/products/${i.code}`}>
                  <img src={i.img} alt="" />
                </Link>
                <span className="fcart-nm">
                  <Link to={`/products/${i.code}`}>
                    <b>{i.name}</b>
                  </Link>
                  <span>{i.option}</span>
                  {/* 미리보기에서 바로 수량 (2026-11-27) — 1개에서 − 누르면 뺀다 */}
                  <span className="fcart-qty">
                    <button
                      type="button"
                      aria-label={i.qty > 1 ? "하나 빼기" : "삭제"}
                      onClick={() => (i.qty > 1 ? setQty(i.sku, i.qty - 1) : removeFromCart([i.sku]))}
                    >
                      −
                    </button>
                    <em>{i.qty}</em>
                    <button type="button" aria-label="하나 더" onClick={() => setQty(i.sku, i.qty + 1)} disabled={i.qty >= 10}>
                      +
                    </button>
                  </span>
                </span>
                <span className="fcart-pr">{won((i.price || 0) * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="fcart-foot">
            <div className="fcart-row">
              <span>상품 {count}개</span>
              <span>{won(total)}</span>
            </div>
            {/* 미리보기에는 배송비를 안 보인다 (2026-11-27 사용자) — 배송비 별도면 장바구니 · 주문서에서만 */}
            {!f.on && (
              <div className="fcart-row">
                <span>배송비</span>
                <span>무료</span>
              </div>
            )}
            <div className="fcart-total">
              <span>합계</span>
              <span>{won(total)}</span>
            </div>
            <button className="btn-black fcart-order" onClick={order}>
              주문하기
            </button>
            <Link className="fcart-all" to="/cart">
              장바구니 전체 보기 · 수량 바꾸기
            </Link>
          </div>
        </div>
      )}
      <button
        className={`fcart-btn${bump ? ' bump' : ''}`}
        aria-label={`장바구니 ${count}개`}
        aria-expanded={open}
        onAnimationEnd={() => setBump(false)}
        onClick={() => (mobile() ? navigate('/cart') : setOpen((v) => !v))}
      >
        <Bag />
        <span className="fcart-cnt">{count > 99 ? '99+' : count}</span>
        <span className="fcart-sum">{won(total)}</span>
      </button>
    </div>
  )
}
