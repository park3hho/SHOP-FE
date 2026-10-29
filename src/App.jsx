// 메인 화면 = Today (메뉴 첫째, 기획 큐레이션 — 지금은 디자인 시안). Shop(/products) 둘째, Story(/story, MKT 팀 글) 셋째.
import data from './data/mock.js'
import { Link } from './lib/router'

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
    <Link className="row" to={`/products/${p.code}`}>
      <img className="row-img" src={p.img} alt="" loading="lazy" />
      <div className="row-body">
        <div className="brand">{p.brand}</div>
        <div className="name">{p.name}</div>
        <div className="price"><em>{p.off}%</em>{won(p.price)}</div>
        <div className="tags"><span>무료배송</span><span>해외직배송</span></div>
      </div>
      <button className="like" aria-label="찜" onClick={(e) => e.preventDefault()}><Heart /></button>
    </Link>
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

export default function App({ Header, Footer }) {
  return (
    <>
      <Header />

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
          <Link to="/products">전체보기</Link>
        </div>
        <div className="best-grid">
          {data.best.map((p, i) => {
            // p.stage = 대표이미지(연출) · p.hover = 대표이미지(전환용, 없으면 실물 p.img 로 전환)
            // AGC 에 저장된 연출컷(api.eidofood.com/files/...)은 '연출 이미지' 글씨가 파일에 들어 있어 글씨를 또 얹지 않는다
            const burned = p.stage && !p.stage.startsWith('/img/')
            return (
            <Link className="card" to={`/products/${p.code}`} key={p.code}>
              <div className={`card-img${p.stage ? ' has-stage' : ''}`}>
                {p.stage && <img className="stage" src={p.stage} alt="" loading="lazy" />}
                <img className="real" src={(p.stage && p.hover) || p.img} alt="" loading="lazy" />
                <span className="rank">{i + 1}</span>
                {p.stage && !burned && <span className="staged">연출 이미지</span>}
              </div>
              <div className="brand">{p.brand}</div>
              <div className="name">{p.name}</div>
              <div className="cn">{p.cn}</div>
              <div className="price"><em>{p.off}%</em>{won(p.price)}</div>
            </Link>
            )
          })}
        </div>
      </section>

      <Footer />
    </>
  )
}
