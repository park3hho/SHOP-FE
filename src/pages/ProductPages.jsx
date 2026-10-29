import { useEffect, useState } from 'react'

import { Page } from '../components/Layout'
import { getProduct, listProducts, useMember, won } from '../lib/api'
import { addToCart, setBuyNow } from '../lib/cart'
import { Link, navigate } from '../lib/router'

// 상품 목록 /products?q= — 4열 그리드 (29CM 카테고리 목록처럼 사진 크게, 글자는 아래 3줄)
export function ProductListPage({ query }) {
  const q = query.get('q') || ''
  const page = Number(query.get('page')) || 1
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setData(null)
    listProducts(q, page, 40)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [q, page])
  const pages = data ? Math.ceil(data.total / data.size) : 1
  return (
    <Page>
      <div className="list-head">
        <h1>{q ? `‘${q}’` : '전체 상품'}</h1>
        {data && <span className="muted">{data.total}개</span>}
      </div>
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
            <Link
              key={n}
              className={n === page ? 'on' : ''}
              to={`/products?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${n}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </Page>
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
          <select className="select" value={sku} onChange={(e) => (setSku(e.target.value), setMsg(''))}>
            <option value="">옵션 선택</option>
            {p.options.map((o) => (
              <option key={o.sku} value={o.sku}>
                {o.name} · {won(o.price)}
              </option>
            ))}
          </select>
          {opt && (
            <div className="pd-line">
              <span>{opt.name}</span>
              <Qty value={qty} max={opt.max_qty} onChange={setQty} />
              <b>{won(opt.price * qty)}</b>
            </div>
          )}
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
        <div className="pd-detail">
          {p.detail_images.length ? (
            p.detail_images.map((u) => <img key={u} src={u} alt="" loading="lazy" />)
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
