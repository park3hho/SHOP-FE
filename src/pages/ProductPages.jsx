import { useEffect, useRef, useState } from 'react'

import { Page } from '../components/Layout'
import { getProduct, listProducts, useCategories, useMember, won } from '../lib/api'
import { addToCart, setBuyNow } from '../lib/cart'
import { Link, navigate } from '../lib/router'

// 상품 목록 /products?q=&cat=&sub=&form= — 4열 그리드 (29CM 카테고리 목록처럼 사진 크게, 글자는 아래 3줄)
//   cat·sub·form = AGC 제품 분류. 분류로 들어오면 제목 아래에 같은 대분류의 소분류 글자 탭
export function ProductListPage({ query }) {
  const q = query.get('q') || ''
  const cat = query.get('cat') || ''
  const sub = query.get('sub') || ''
  const form = query.get('form') || ''
  const page = Number(query.get('page')) || 1
  const cats = useCategories()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setData(null)
    listProducts(q, page, 40, { cat, sub, form })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [q, cat, sub, form, page])
  const pages = data ? Math.ceil(data.total / data.size) : 1
  const c = cats?.find((x) => x.code === cat)
  const title = q
    ? `‘${q.split('|')[0]}’`
    : c
      ? c.sub.find((s) => s.code === sub)?.label || c.forms.find((f) => f.code === form)?.label || c.label
      : '전체 상품'
  const href = (o) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ q, cat, sub, form, ...o })) if (v && !(k === 'page' && v === 1)) p.set(k, v)
    return `/products?${p}`
  }
  return (
    <Page>
      <div className="list-head">
        <h1>{title}</h1>
        {data && <span className="muted">{data.total}개</span>}
      </div>
      {c && (
        <nav className="cat-tabs">
          <Link className={!sub && !form ? 'on' : ''} to={href({ sub: '', form: '', page: 1 })}>
            전체
          </Link>
          {c.sub.map((s) => (
            <Link key={s.code} className={s.code === sub ? 'on' : ''} to={href({ sub: s.code, page: 1 })}>
              {s.label}
            </Link>
          ))}
          {c.forms.length > 0 && <span className="bar" />}
          {c.forms.map((f) => (
            <Link key={f.code} className={f.code === form ? 'on' : ''} to={href({ form: f.code === form ? '' : f.code, page: 1 })}>
              {f.label}
            </Link>
          ))}
        </nav>
      )}
      {error && <p className="error">{error}</p>}
      {data && !data.items.length && <p className="empty">찾는 상품이 없어요.</p>}
      <div className="grid">
        {(data?.items || []).map((p) => (
          <Link className="card" key={p.code} to={`/products/${p.code}`}>
            <div className="card-img">
              <img className="real" src={p.img} alt="" loading="lazy" />
              {p.img_hover && <img className="hover" src={p.img_hover} alt="" loading="lazy" />}
            </div>
            <div className="brand">{p.brand}</div>
            <div className="name">{p.name}</div>
            <div className="cn">{p.name_cn}</div>
            <div className="price">{p.price ? `${won(p.price)}~` : '-'}</div>
          </Link>
        ))}
      </div>
      {pages > 1 && (
        <div className="pager">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} className={n === page ? 'on' : ''} to={href({ page: n })}>
              {n}
            </Link>
          ))}
        </div>
      )}
    </Page>
  )
}
// 100ml당 가격 — 용량을 모르면 null
const per100 = (o) => (o.volume_ml ? Math.round((o.price / o.volume_ml) * 100) : null)

// 옵션 고르기 — 구성(용량·입수)별로 묶고, 구성·옵션 모두 가격 낮은 순 (2026-10-29 사용자: 싼 것부터). 각 줄에 100ml당 가격.
//   옵션이 많으면 목록 칸 안에서만 스크롤 (기본 select 는 항목이 많으면 읽기 어려웠다, 2026-10-29)
function OptionPicker({ options, value, onChange }) {
  const groups = new Map()
  for (const o of options) {
    const k = o.pack || ''
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(o)
  }
  const list = [...groups.entries()]
    .map(([pack, items]) => ({ pack, items: [...items].sort((a, b) => a.price - b.price) }))
    .sort((a, b) => a.items[0].price - b.items[0].price)
  const showHead = list.length > 1 || list[0]?.pack
  return (
    <div className="opt-pick" role="radiogroup" aria-label="옵션 선택">
      {list.map((g) => (
        <div className="opt-group" key={g.pack || '-'}>
          {showHead && (
            <div className="opt-head">
              <b>{g.pack || '기본'}</b>
            </div>
          )}
          {g.items.map((o) => {
            const u = per100(o)
            return (
              <button
                type="button"
                role="radio"
                aria-checked={o.sku === value}
                key={o.sku}
                className={`opt-row${o.sku === value ? ' on' : ''}`}
                onClick={() => onChange(o.sku)}
              >
                <span className="opt-name">{o.flavor || o.name}</span>
                <span className="opt-price">
                  <b>{won(o.price)}</b>
                  {u && <small>100ml당 {won(u)}</small>}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// 상품 상세 /products/:code — 왼쪽 사진, 오른쪽 정보·옵션·수량·구매 (아래로 상세 이미지 · 상품 정보)
export function ProductDetailPage({ code }) {
  const member = useMember()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(0)
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('detail')
  const detailRef = useRef(null) // 상세 이미지 스크롤 칸
  const optRef = useRef(null) // 옵션 목록 — 안 고르고 담으면 여기로

  useEffect(() => {
    getProduct(code)
      .then((d) => {
        setP(d)
        setSku(d.options.length === 1 ? d.options[0].sku : '')
      })
      .catch((e) => setError(e.message))
  }, [code])

  if (error)
    return (
      <Page narrow>
        <p className="error">{error}</p>
        <Link to="/products">상품 목록으로</Link>
      </Page>
    )
  if (!p) return <Page narrow>불러오는 중…</Page>

  const opt = p.options.find((o) => o.sku === sku)
  const line = () => ({
    sku: opt.sku,
    code: p.code,
    name: p.name,
    option: opt.name,
    price: opt.price,
    img: opt.photo || p.photos[0],
    qty,
  })
  const need = () => {
    if (!opt) {
      setMsg('옵션을 골라 주세요')
      optRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  return (
    <Page>
      <div className="pd">
        <div className="pd-photos">
          <div className="pd-main">
            <img src={p.photos[photo]} alt={p.name} />
          </div>
          {p.photos.length > 1 && (
            <div className="pd-thumbs">
              {p.photos.map((u, i) => (
                <button key={u} className={i === photo ? 'on' : ''} onClick={() => setPhoto(i)}>
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pd-info">
          <div className="brand">{p.brand}</div>
          <h1>{p.name}</h1>
          <div className="cn">{p.name_cn}</div>
          <div className="pd-price">{won(opt ? opt.price : Math.min(...p.options.map((o) => o.price)))}</div>
          <dl className="pd-meta">
            <dt>배송</dt>
            <dd>{p.shipping.note}</dd>
          </dl>
          <div ref={optRef}>
            <OptionPicker options={p.options} value={sku} onChange={(s) => (setSku(s), setMsg(''))} />
          </div>
          {opt && (
            <div className="pd-line">
              <span>{opt.name}</span>
              <Qty value={qty} max={opt.max_qty} onChange={setQty} />
              <b>{won(opt.price * qty)}</b>
            </div>
          )}
          <div className="pd-buy">
          <div className="pd-total">
            <span>총 상품 금액</span>
            <b>{won(opt ? opt.price * qty : 0)}</b>
          </div>
          <div className="pd-buttons">
            <button
              className="btn-line"
              onClick={() => {
                if (!need()) return
                addToCart(line())
                setMsg('장바구니에 담았어요')
              }}
            >
              장바구니
            </button>
            <button
              className="btn-black"
              onClick={() => {
                if (!need()) return
                setBuyNow([line()])
                navigate(member ? '/order/checkout?buy=now' : '/login?next=' + encodeURIComponent('/order/checkout?buy=now'))
              }}
            >
              바로구매
            </button>
          </div>
          </div>
          {msg && (
            <p className="hint">
              {msg} {msg.startsWith('장바구니') && <Link to="/cart">장바구니 보기</Link>}
            </p>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'detail' ? 'on' : ''} onClick={() => setTab('detail')}>
          상품 상세
        </button>
        <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>
          상품 정보
        </button>
        <button className={tab === 'ship' ? 'on' : ''} onClick={() => setTab('ship')}>
          배송 · 교환 · 환불
        </button>
      </div>
      {tab === 'detail' && (
        // 상세 이미지는 아주 길어서 정해진 높이 안에서만 스크롤 — 다 내려도 페이지로 돌아오기 쉽게
        <div className="pd-detail">
          {p.detail_images.length ? (
            <div className="pd-detail-scroll" ref={detailRef}>
              {p.detail_images.map((u) => (
                <img key={u} src={u} alt="" loading="lazy" />
              ))}
              <button
                type="button"
                className="pd-detail-top"
                onClick={() => detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                맨 위로
              </button>
            </div>
          ) : (
            <p className="empty">상세 설명을 준비하고 있어요.</p>
          )}
        </div>
      )}
      {tab === 'info' && (
        <dl className="kv">
          <dt>상품명</dt>
          <dd>
            {p.name} ({p.name_cn})
          </dd>
          {p.info.map((r) => (
            <span key={r.label} style={{ display: 'contents' }}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </span>
          ))}
          <dt>원산지</dt>
          <dd>중국</dd>
        </dl>
      )}
      {tab === 'ship' && <ShippingGuide />}
    </Page>
  )
}

export function ShippingGuide() {
  return (
    <div className="guide">
      <h3>해외구매대행 상품이에요</h3>
      <p>중국 판매처에서 구매해 받는 분 이름으로 통관한 뒤 보내 드려요. 그래서 개인통관고유부호가 꼭 필요해요.</p>
      <h3>배송</h3>
      <p>무료배송 · 결제 후 약 7~14일 (통관 상황에 따라 늦어질 수 있어요).</p>
      <h3>취소</h3>
      <p>상품 준비 전(주문 접수 상태)에는 마이페이지에서 바로 취소할 수 있어요. 준비가 시작된 뒤에는 고객센터로 문의해 주세요.</p>
      <h3>교환 · 환불</h3>
      <p>식품 특성상 단순 변심 반품은 어려워요. 받은 상품이 파손됐거나 주문과 다르면 사진과 함께 알려 주시면 확인 후 환불해 드려요.</p>
    </div>
  )
}

export function Qty({ value, max = 10, onChange }) {
  return (
    <span className="qty">
      <button onClick={() => onChange(Math.max(1, value - 1))} aria-label="빼기">
        −
      </button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="더하기">
        +
      </button>
    </span>
  )
}
