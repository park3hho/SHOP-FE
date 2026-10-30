// 메인 화면 = Today (메뉴 첫째, 기획 큐레이션 — 지금은 디자인 시안). Shop(/products) 둘째, Story(/story, MKT 팀 글) 셋째.
import { useEffect, useState } from 'react'

import data from './data/mock.js'
import { listProducts } from './lib/api'
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

// 첫 화면 목록(mock.js)은 시안이라 상품 코드가 고정. 지금 자사몰에서 파는 상품(마켓 등록 + 삭제 안 됨)만 남기고,
// 사진은 AGC 에 저장된 지금 값으로 덮는다 (대표이미지 = 연출 · 전환용 = 마우스 올리면). 가격·할인율은 아직 시안 값.
//   안 파는·삭제된 상품이 첫 화면에 남아 눌러도 '없는 상품'이 뜨던 것 (2026-10-29)
const LISTS = ['tea', 'lychee', 'fridge', 'milktea', 'best']

async function onSaleMap() {
  const map = new Map()
  for (let page = 1; page <= 10; page++) {
    const r = await listProducts('', page, 100)
    r.items.forEach((x) => map.set(x.code, x))
    if (r.items.length < 100 || map.size >= r.total) break
  }
  return map
}

function useLiveData() {
  const [lists, setLists] = useState(null) // 확인 전엔 비워 둔다 — 안 파는 상품이 잠깐 비쳤다 사라지지 않게
  useEffect(() => {
    let alive = true
    onSaleMap()
      .then((sale) => {
        if (!alive) return
        const out = {}
        for (const k of LISTS) {
          out[k] = data[k]
            .filter((p) => sale.has(p.code))
            .map((p) => {
              const l = sale.get(p.code)
              if (k !== 'best' || !l.img) return p
              return { ...p, stage: l.img, hover: l.img_hover || p.img, img: l.img_hover || l.img }
            })
        }
        setLists(out)
      })
      .catch(() => alive && setLists(Object.fromEntries(LISTS.map((k) => [k, data[k]])))) // 서버가 안 되면 시안 그대로
    return () => {
      alive = false
    }
  }, [])
  return lists || Object.fromEntries(LISTS.map((k) => [k, []]))
}
// NEW · TEA — 차(찻잎 · 티백)가 들어왔다는 걸 Today 에서 보여 주는 띠 (2026-10-30 사용자: "차 들어온 거 표현, CHAGEE")
//   상품은 자사몰에서 지금 파는 CHAGEE 차만 (분류 tea + 이름 '차지'). 하나도 없으면 띠를 숨긴다.
const TEA_HERO = 'PR-261029-0027' // 띠 왼쪽 큰 사진 = 이 상품의 대표이미지(연출컷). 안 팔면 첫 상품

function useChagee() {
  const [items, setItems] = useState([])
  useEffect(() => {
    listProducts('차지', 1, 8, { cat: 'tea' })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
  }, [])
  return items
}

// '[냉침 티백] 차지(CHAGEE) 과일칩 냉침차 + 티백 세트' → { form: '냉침 티백', name: '과일칩 냉침차 + 티백 세트' }
const teaName = (name) => {
  const m = name.match(/^\[([^\]]+)\]\s*(.*)$/)
  const rest = (m ? m[2] : name).replace(/^차지\(CHAGEE\)\s*/, '')
  return { form: m ? m[1] : '', name: rest }
}

function TeaBand({ items }) {
  if (!items.length) return null
  const hero = items.find((p) => p.code === TEA_HERO) || items[0]
  return (
    <section className="tea-band">
      <Link className="tea-band-img" to={`/products/${hero.code}`} style={{ backgroundImage: `url(${hero.img})` }} aria-label={hero.name} />
      <div className="tea-band-body">
        <p className="tea-eyebrow">NEW · TEA</p>
        <h2>
          CHAGEE <span className="cn">霸王茶姬</span>
          <br />
          이제 집에서 우려 마셔요
        </h2>
        <p className="tea-lead">
          윈난에서 시작한 중국 대표 차 브랜드, 차지(CHAGEE). 매장에서 쓰는 원엽차를 한 잔씩 우리는 티백으로 들여왔어요. 장미 보이차부터 우롱, 냉침 과일차까지.
        </p>
        <div className="tea-cards">
          {items.slice(0, 4).map((p) => {
            const n = teaName(p.name)
            return (
              <Link className="tea-card" to={`/products/${p.code}`} key={p.code}>
                <div className="tea-card-img">
                  <img src={p.img} alt="" loading="lazy" />
                  {p.img_hover && <img className="hover" src={p.img_hover} alt="" loading="lazy" />}
                </div>
                {n.form && <div className="tea-form">{n.form}</div>}
                <div className="name">{n.name}</div>
                <div className="price">{p.price ? `${won(p.price)}원~` : ''}</div>
              </Link>
            )
          })}
        </div>
        <Link className="tea-more" to="/products?cat=tea">
          Tea 전체 보기 →
        </Link>
      </div>
    </section>
  )
}
export default function App({ Header, Footer }) {
  const live = useLiveData()
  const chagee = useChagee()
  const best = live.best
  return (
    <>
      <Header />

      <main className="board">
        <div className="col col-hero">
          <Hero img="/img/soda.jpg" en="ARCTIC OCEAN" ko="북빙양 · 1936년부터 베이징의 귤맛 사이다" />
          <Hero img="/img/lychee.jpg" en="LYCHEE SEASON" ko="리치 · 광둥에서 온 여름의 맛" />
        </div>
        <div className="col">
          <Story img="/img/tea.jpg" title="무가당 차, 처음이라면" sub="단맛 없이 향만 남긴 중국 편의점 차예요." items={live.tea} />
          <Story img="/img/lychee-glass.jpg" title="리치 탄산 모음" sub="한국에선 보기 힘든 리치맛만 골랐어요." items={live.lychee} />
        </div>
        <div className="col">
          <Story img="/img/fridge.jpg" title="중국 편의점 냉장고, 그대로" sub="현지에서 제일 많이 집는 음료를 옮겨왔어요." items={live.fridge} />
          <Story img="/img/milktea.jpg" title="밀크티, 홍콩식부터 소금 밀크티까지" sub="한국 편의점엔 없는 밀크티만 모았어요." items={live.milktea} />
        </div>
      </main>

      <TeaBand items={chagee} />

      <section className="best">
        <div className="best-head">
          <h2>지금 많이 담는 음료</h2>
          <span className="best-note">사진에 마우스를 올리면 실제 상품 사진 · 할인율은 쿠팡 판매가 대비</span>
          <Link to="/products">전체보기</Link>
        </div>
        <div className="best-grid">
          {best.map((p, i) => {
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
