// 목록에서 바로 장바구니 담기 (2026-11-27 목업 v4 승인) — 가격 줄 오른쪽 끝, 하트처럼 얕은 회색 선 아이콘.
// 옵션 1개면 바로 담고 잠깐 체크, 여러 개면 아이콘 위에 옵션 목록(휴대폰은 아래에서 올라오는 시트). 카드(Link) 클릭은 막는다.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { getProduct, won } from '../lib/api'
import { addToCart } from '../lib/cart'
import { track } from '../lib/track'

const cache = new Map()
const load = (code) => {
  if (!cache.has(code)) cache.set(code, getProduct(code).catch((e) => (cache.delete(code), Promise.reject(e))))
  return cache.get(code)
}

const CartIcon = () => (
  <svg viewBox="2 2 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M5 8h14l-1.2 11H6.2z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    <path d="M12 11v5M9.5 13.5h5" />
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="2 2 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

let toastTimer
const toast = (msg) => {
  let el = document.querySelector('.qa-toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'qa-toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('on'), 1400)
}

export default function QuickAdd({ code }) {
  const btn = useRef(null)
  const [done, setDone] = useState(false)
  const [menu, setMenu] = useState(null) // { p, rect }

  useEffect(() => {
    if (!menu) return
    const close = (e) => !e.target.closest?.('.qa-pop') && setMenu(null)
    const esc = (e) => e.key === 'Escape' && setMenu(null)
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', () => setMenu(null), { once: true })
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [menu])

  const add = (p, opt) => {
    addToCart({ sku: opt.sku, code: p.code, name: p.name, option: opt.name, price: opt.price, img: opt.photo || p.photos?.[0], qty: 1 })
    track('add_to_cart', { code: p.code, value: opt.price, from: 'list' })
    setMenu(null)
    setDone(true)
    toast('장바구니에 담았어요')
    setTimeout(() => setDone(false), 1200)
  }

  const click = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (menu) return setMenu(null)
    try {
      const p = await load(code)
      const opts = p.options || []
      if (!opts.length) return
      if (opts.length === 1) return add(p, opts[0])
      setMenu({ p, rect: btn.current.getBoundingClientRect() })
    } catch {
      toast('상품을 불러오지 못했어요')
    }
  }

  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  return (
    <>
      <button ref={btn} type="button" className={`qa-btn${done ? ' done' : ''}`} aria-label="장바구니 담기" onClick={click}>
        {done ? <CheckIcon /> : <CartIcon />}
      </button>
      {menu &&
        createPortal(
          <div
            className={`qa-pop${mobile ? ' sheet' : ''}`}
            style={mobile ? undefined : { right: window.innerWidth - menu.rect.right, bottom: window.innerHeight - menu.rect.top + 6 }}
            onClick={(e) => e.stopPropagation()}
          >
            {mobile && <div className="qa-pop-head">{menu.p.name}</div>}
            {menu.p.options.map((o) => (
              <button key={o.sku} type="button" onClick={() => add(menu.p, o)}>
                <span>{o.name}</span>
                <b>{won(o.price)}</b>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
