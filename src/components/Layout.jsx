import { useEffect, useState } from 'react'

import { useCategories, useMember } from '../lib/api'
import { useCart } from '../lib/cart'
import { Link, navigate, useLocation } from '../lib/router'

// 서버 응답 전 잠깐 보이는 메뉴 (자리 흔들림 방지)
const FALLBACK = [
  { code: 'beverage', en: 'Drink', label: '음료', count: 0, sub: [], forms: [] },
  { code: 'tea', en: 'Tea', label: '차', count: 0, sub: [], forms: [] },
]

// 메가 메뉴 오른쪽 기획 사진 — 소분류 대표 사진(GET /categories sub[].img) + 한 줄
const FEATURES = [
  { cat: 'beverage', sub: 'soda', title: '베이징의 귤맛 사이다부터' },
  { cat: 'beverage', sub: 'milktea', title: '홍콩식 밀크티' },
]

const catUrl = (c, s) => `/products?cat=${c}${s ? `&sub=${s}` : ''}`

// 메가 메뉴 한 칸 — 대분류 이름 + 소분류 목록(한글 · 영문 · 개수). 0개는 흐리게(곧 들어옴), 누르지 못함
function MegaColumn({ c, onGo }) {
  return (
    <div className="mega-col">
      <div className="mega-h">
        {c.en.toUpperCase()} <span>{c.count ? `${c.label} · ${c.count}` : `${c.label} · 곧 들어와요`}</span>
      </div>
      {c.sub.map((s) =>
        s.count ? (
          <Link key={s.code} className="mega-row" to={catUrl(c.code, s.code)} onClick={onGo}>
            <b>{s.label}</b>
            <em>{s.en}</em>
            <span>{s.count}</span>
          </Link>
        ) : (
          <div key={s.code} className="mega-row off">
            <b>{s.label}</b>
            <em>{s.en}</em>
            <span>-</span>
          </div>
        ),
      )}
      {c.count > 0 && (
        <Link className="mega-all" to={catUrl(c.code)} onClick={onGo}>
          {c.label} 전체 보기 →
        </Link>
      )}
      {c.forms?.length > 0 && (
        <div className="mega-forms">
          형태{' '}
          {c.forms.map((f) => (
            <span key={f.code} className={f.count ? '' : 'off'}>
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 공통 머리 — 로고 · 메뉴 · 검색 · 로그인/마이페이지 · 장바구니(개수)
//   분류 메뉴 = 메가 메뉴 (2026-10-29 사용자 A안): 둘째 줄엔 DRINK · TEA 만, 마우스를 올리면 아래로 넓은 판.
//   모바일은 ☰ → 전체 화면 메뉴 (DRINK/TEA 탭 + 사진 달린 소분류 목록)
export function Header() {
  const member = useMember()
  const cart = useCart()
  const cats = useCategories() || FALLBACK
  const { path } = useLocation()
  // 메뉴 순서: Today(메인 = 첫 화면, 기획 큐레이션) → Shop(상품) → Story(MKT 팀 글 — 나중에 올림)
  const onToday = path === '/'
  const onShop = path.startsWith('/products')
  const onStory = path.startsWith('/story')
  const [q, setQ] = useState('')
  const [mega, setMega] = useState(null) // 데스크탑: 마우스 올린 대분류 코드
  const [drawer, setDrawer] = useState(false) // 모바일 ☰ 메뉴
  const [tab, setTab] = useState('beverage') // 모바일 메뉴 탭
  const close = () => (setMega(null), setDrawer(false))
  useEffect(close, [path])
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
  }, [drawer])
  const cur = new URLSearchParams(window.location.search).get('cat')
  const bev = cats.find((c) => c.code === 'beverage')
  const feats = FEATURES.map((f) => ({ ...f, s: bev?.sub.find((s) => s.code === f.sub) })).filter((f) => f.s?.img)
  const tabCat = cats.find((c) => c.code === tab) || cats[0]
  return (
    <>
      <div className="notice">오픈 준비 중이에요 · 결제는 테스트 결제라 실제로 돈이 나가지 않아요</div>
      <header className="header" onMouseLeave={() => setMega(null)}>
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
          <div className="gnb-cat">
            {cats.map((c) => (
              <Link
                key={c.code}
                to={catUrl(c.code)}
                className={`cat${cur === c.code || mega === c.code ? ' on' : ''}`}
                onMouseEnter={() => setMega(c.code)}
                onFocus={() => setMega(c.code)}
                onClick={close}
              >
                {c.en.toUpperCase()}
                <i className={c.count ? '' : 'soon'}>{c.count || 'soon'}</i>
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
          <button className="menu-btn" aria-label="메뉴" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
            {drawer ? '✕' : '☰'}
          </button>
        </div>

        {mega && (
          <div className="mega" onMouseEnter={() => setMega(mega)}>
            {cats.map((c) => (
              <MegaColumn key={c.code} c={c} onGo={close} />
            ))}
            <div className="mega-feat">
              {feats.map((f) => (
                <Link key={f.sub} className="mega-img" to={catUrl(f.cat, f.sub)} onClick={close} style={{ backgroundImage: `url(${f.s.img})` }}>
                  <span>
                    <small>
                      {f.s.label} · {f.s.count}
                    </small>
                    <b>{f.title}</b>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {drawer && (
          <div className="drawer">
            <div className="drawer-tabs">
              {cats.map((c) => (
                <button key={c.code} className={c.code === tabCat.code ? 'on' : ''} onClick={() => setTab(c.code)}>
                  {c.en.toUpperCase()}
                  {!c.count && <i>soon</i>}
                </button>
              ))}
            </div>
            {tabCat.sub.map((s) =>
              s.count ? (
                <Link key={s.code} className="drawer-row" to={catUrl(tabCat.code, s.code)} onClick={close}>
                  {s.img ? <img src={s.img} alt="" /> : <span className="ph" />}
                  <span>
                    <b>{s.label}</b>
                    <em>{s.en}</em>
                  </span>
                  <span className="n">{s.count}</span>
                </Link>
              ) : (
                <div key={s.code} className="drawer-row off">
                  <span className="ph" />
                  <span>
                    <b>{s.label}</b>
                    <em>{s.en}</em>
                  </span>
                  <span className="n">곧</span>
                </div>
              ),
            )}
            {tabCat.count > 0 && (
              <Link className="drawer-all" to={catUrl(tabCat.code)} onClick={close}>
                {tabCat.label} 전체 보기 <span>{tabCat.count} →</span>
              </Link>
            )}
          </div>
        )}
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
        <Link to="/policy">배송 · 교환 · 환불</Link>
        <Link to="/guide">해외구매대행 안내</Link>
      </nav>
      <p>
        상호 이도 · 대표 박찬호 · 사업자등록번호 715-07-03296 · 통신판매업 제 2026-충남아산-0848 호
        <br />
        사업장 주소 충청남도 아산시 배방읍 북수로 33, 102동 1602호 · 고객센터 010-7590-7429 · kkjjww1102@gmail.com
        <br />
        수입식품등 인터넷구매대행업 영업등록 제 20260028639 호
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
