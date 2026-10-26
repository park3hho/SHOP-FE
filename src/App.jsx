import data from './data/mock.js'

const won = (n) => n.toLocaleString('ko-KR')

function Heart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  )
}

function Row({ p }) {
  return (
    <a className="row" href="#">
      <img className="row-img" src={p.img} alt="" loading="lazy" />
      <div className="row-body">
        <div className="brand">{p.brand}</div>
        <div className="name">{p.name}</div>
        <div className="price"><em>{p.off}%</em>{won(p.price)}</div>
        <div className="tags"><span>무료배송</span><span>해외직배송</span></div>
      </div>
      <button className="like" aria-label="찜"><Heart /></button>
    </a>
  )
}

function Story({ img, title, sub, items }) {
  return (
    <section className="story">
      <div className="story-img" style={{ backgroundImage: `url(${img})` }}><span className="staged">연출 이미지</span></div>
      <h2>{title}</h2>
      <p>{sub}</p>
      <div className="rows">{items.map((p) => <Row key={p.code} p={p} />)}</div>
    </section>
  )
}

function Hero({ img, en, ko }) {
  return (
    <a className="hero" href="#" style={{ backgroundImage: `url(${img})` }}>
      <span className="staged">연출 이미지</span>
      <div className="hero-text">
        <strong>{en}</strong>
        <span>{ko}</span>
      </div>
    </a>
  )
}

export default function App() {
  return (
    <>
      <div className="notice">오픈 준비 중이에요 · 지금 보이는 화면은 디자인 시안이고 가격은 예시예요</div>
      <header className="header">
        <a className="logo" href="/">EIDOFOOD</a>
        <nav className="gnb">
          <div className="gnb-main"><a>Best</a><a>New</a><a>Story</a><a>Set</a></div>
          <div className="gnb-sub">
            <a>탄산</a><a>주스</a><a>차</a><a>밀크티</a><a>우유·두유</a><a>커피</a><a>전해질</a>
            <i className="bar" /><a className="it">Beijing</a><a className="it">Guangdong</a>
          </div>
        </nav>
        <div className="util"><a>로그인</a><a>장바구니 0</a></div>
      </header>

      <main className="board">
        <div className="col col-hero">
          <Hero img="/img/soda.jpg" en="ARCTIC OCEAN" ko="북빙양 · 1936년부터 베이징의 귤맛 사이다" />
          <Hero img="/img/lychee.jpg" en="LYCHEE SEASON" ko="리치 · 광둥에서 온 여름의 맛" />
        </div>
        <div className="col">
          <Story img="/img/tea.jpg" title="무가당 차, 처음이라면" sub="단맛 없이 향만 남긴 중국 편의점 차예요." items={data.tea} />
          <Story img="/img/lychee-glass.jpg" title="리치 탄산 모음" sub="한국에선 보기 힘든 리치맛만 골랐어요." items={data.lychee} />
        </div>
        <div className="col">
          <Story img="/img/fridge.jpg" title="중국 편의점 냉장고, 그대로" sub="현지에서 제일 많이 집는 음료를 옮겨왔어요." items={data.fridge} />
          <Story img="/img/milktea.jpg" title="밀크티, 홍콩식부터 소금 밀크티까지" sub="한국 편의점엔 없는 밀크티만 모았어요." items={data.milktea} />
        </div>
      </main>

      <section className="best">
        <div className="best-head">
          <h2>지금 많이 담는 음료</h2>
          <span className="best-note">사진에 마우스를 올리면 실제 상품 사진 · 할인율은 쿠팡 판매가 대비</span>
          <a>전체보기</a>
        </div>
        <div className="best-grid">
          {data.best.map((p, i) => (
            <a className="card" href="#" key={p.code}>
              <div className={`card-img${p.stage ? ' has-stage' : ''}`}>
                {p.stage && <img className="stage" src={p.stage} alt="" loading="lazy" />}
                <img className="real" src={p.img} alt="" loading="lazy" />
                <span className="rank">{i + 1}</span>
                {p.stage && <span className="staged">연출 이미지</span>}
              </div>
              <div className="brand">{p.brand}</div>
              <div className="name">{p.name}</div>
              <div className="cn">{p.cn}</div>
              <div className="price"><em>{p.off}%</em>{won(p.price)}</div>
            </a>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="logo small">EIDOFOOD</div>
        <p>
          상호 이도 · 대표 박찬호 · 사업자등록번호 715-07-03296 · 통신판매업 제 2026-충남아산-0848 호<br />
          수입식품등 인터넷구매대행업 영업등록 제 20260028639 호
        </p>
      </footer>
    </>
  )
}
