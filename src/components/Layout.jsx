import { useState } from 'react'

import { useMember } from '../lib/api'
import { useCart } from '../lib/cart'
import { Link, navigate, useLocation } from '../lib/router'

// 공통 머리 — 로고 · 메뉴 · 검색 · 로그인/마이페이지 · 장바구니(개수)
export function Header() {
  const member = useMember()
  const cart = useCart()
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
            {/* [보이는 이름, 검색어] — 이온음료는 상품명에 '전해질'로 적혀 있어 그 말로 찾는다 */}
            {[
              ['탄산', '탄산'],
              ['주스', '주스'],
              ['차', '차'],
              ['밀크티', '밀크티'],
              ['우유', '우유'],
              ['커피', '커피'],
              ['이온음료', '전해질'],
            ].map(([label, q]) => (
              <Link key={label} to={`/products?q=${encodeURIComponent(q)}`}>
                {label}
              </Link>
            ))}
          </div>
        </nav>
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
