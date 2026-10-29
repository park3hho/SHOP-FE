import { Fragment, useState } from 'react'

import { useCategories, useMember } from '../lib/api'
import { useCart } from '../lib/cart'
import { Link, navigate, useLocation } from '../lib/router'

// 서버 응답 전 잠깐 보이는 메뉴 (자리 흔들림 방지) — Drink(소분류) | Tea
const FALLBACK = [{ code: 'beverage', en: 'Drink', sub: [['soda', '탄산'], ['juice', '주스'], ['tea', '차음료'], ['milktea', '밀크티'], ['coffee', '커피'], ['milk', '우유·두유'], ['functional', '이온·기능성']].map(([code, label]) => ({ code, label })) }, { code: 'tea', en: 'Tea', sub: [] }]

// 공통 머리 — 로고 · 메뉴 · 검색 · 로그인/마이페이지 · 장바구니(개수)
export function Header() {
  const member = useMember()
  const cart = useCart()
  const cats = useCategories()
  const { path } = useLocation()
  // 메뉴 순서: Today(메인 = 첫 화면, 기획 큐레이션) → Shop(상품) → Story(MKT 팀 글 — 나중에 올림)
  const onToday = path === '/'
  const onShop = path.startsWith('/products')
  const onStory = path.startsWith('/story')
  const [q, setQ] = useState('')
  return (
    <>
      <div className="notice">오픈 준비 중이에요 · 결제는 테스트 결제라 실제로 돈이 나가지 않아요</div>
      <header className="header">
        <Link className="logo" to="/">
          EIDOFOOD
        </Link>
        <nav className="gnb">
          <div className="gnb-main">
            <Link to="/" className={onToday ? 'on' : ''}>
              Today
            </Link>
            <Link to="/products" className={onShop ? 'on' : ''}>
              Shop
            </Link>
            <Link to="/story" className={onStory ? 'on' : ''}>
              Story
            </Link>
          </div>
          <div className="gnb-sub">
            {/* 분류 메뉴 — AGC 제품 분류 (GET /categories). Drink | Tea 로 나누고, 소분류는 파는 상품이 있는 것만.
                Tea(찻잎·티백)는 곧 들어와서 미리 자리를 만들어 둠 (2026-10-29) */}
            {(cats || FALLBACK).map((c, i, all) => (
              <Fragment key={c.code}>
                {i > 0 && <span className="bar" />}
                {all.length > 1 && (
                  <Link className="it" to={`/products?cat=${c.code}`}>
                    {c.en}
                  </Link>
                )}
                {c.sub.map((s) => (
                  <Link key={s.code} to={`/products?cat=${c.code}&sub=${s.code}`}>
                    {s.label}
                  </Link>
                ))}
              </Fragment>
            ))}
          </div>        </nav>
        <div className="util">
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(`/products?q=${encodeURIComponent(q.trim())}`)
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" aria-label="상품 검색" />
          </form>
          {member ? <Link to="/my">마이페이지</Link> : <Link to="/login">로그인</Link>}
          <Link to="/cart">장바구니 {cart.length}</Link>
        </div>
      </header>
    </>
  )
}

// 공통 바닥 — 전자상거래법 사업자 정보
export function Footer() {
  return (
    <footer className="footer">
      <div className="logo small">EIDOFOOD</div>
      <nav className="foot-links">
        <Link to="/terms">이용약관</Link>
        <Link to="/privacy">
          <b>개인정보처리방침</b>
        </Link>
        <Link to="/guide">해외구매대행 안내</Link>
      </nav>
      <p>
        상호 이도 · 대표 박찬호 · 사업자등록번호 715-07-03296 · 통신판매업 제 2026-충남아산-0848 호
        <br />
        수입식품등 인터넷구매대행업 영업등록 제 20260028639 호 · 고객센터 준비 중
      </p>
    </footer>
  )
}

export function Page({ children, narrow }) {
  return (
    <>
      <Header />
      <main className={narrow ? 'page narrow' : 'page'}>{children}</main>
      <Footer />
    </>
  )
}
