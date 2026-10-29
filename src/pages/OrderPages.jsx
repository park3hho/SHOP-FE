import { useEffect, useMemo, useState } from 'react'

import { Page } from '../components/Layout'
import { getProfile, listAddresses, myOrder, PAY_METHOD, PROGRESS, useMember, won } from '../lib/api'
import { clearCart, getBuyNow, removeFromCart, setBuyNow, setQty, useCart } from '../lib/cart'
import { createOrder, getPayConfig, payWithKakao, payWithNaver } from '../lib/payments'
import { Link, navigate } from '../lib/router'
import { Qty } from './ProductPages'

const sum = (lines) => lines.reduce((s, l) => s + l.price * l.qty, 0)

// 장바구니 /cart — 줄마다 선택 · 수량 · 삭제, 오른쪽 결제 예정 금액 + 주문하기
export function CartPage() {
  const items = useCart()
  const member = useMember()
  const [picked, setPicked] = useState(() => new Set(items.map((i) => i.sku)))
  useEffect(() => setPicked((s) => new Set([...s].filter((k) => items.some((i) => i.sku === k)))), [items])
  const chosen = items.filter((i) => picked.has(i.sku))
  const all = items.length > 0 && chosen.length === items.length
  const toggle = (sku) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(sku)) n.delete(sku)
      else n.add(sku)
      return n
    })
  const order = () => {
    setBuyNow(chosen)
    const to = '/order/checkout?buy=cart'
    navigate(member ? to : `/login?next=${encodeURIComponent(to)}`)
  }

  return (
    <Page>
      <h1 className="page-title">장바구니</h1>
      {!items.length ? (
        <div className="empty-box">
          <p>장바구니가 비어 있어요.</p>
          <Link className="btn-black inline" to="/products">
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <div className="two-col">
          <div>
            <div className="cart-bar">
              <label>
                <input type="checkbox" checked={all} onChange={() => setPicked(all ? new Set() : new Set(items.map((i) => i.sku)))} /> 전체 선택 ({chosen.length}/{items.length})
              </label>
              <button className="text-btn" disabled={!chosen.length} onClick={() => removeFromCart(chosen.map((i) => i.sku))}>
                선택 삭제
              </button>
            </div>
            {items.map((i) => (
              <div className="line" key={i.sku}>
                <input type="checkbox" checked={picked.has(i.sku)} onChange={() => toggle(i.sku)} aria-label="선택" />
                <Link to={`/products/${i.code}`}>
                  <img src={i.img} alt="" />
                </Link>
                <div className="line-body">
                  <Link className="name" to={`/products/${i.code}`}>
                    {i.name}
                  </Link>
                  <div className="muted">{i.option}</div>
                  <Qty value={i.qty} onChange={(n) => setQty(i.sku, n)} />
                </div>
                <div className="line-price">
                  <b>{won(i.price * i.qty)}</b>
                  <button className="text-btn" onClick={() => removeFromCart([i.sku])}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary">
            <h2>결제 예정 금액</h2>
            <dl>
              <dt>상품 금액</dt>
              <dd>{won(sum(chosen))}</dd>
              <dt>배송비</dt>
              <dd>무료</dd>
            </dl>
            <div className="summary-total">
              <span>합계</span>
              <b>{won(sum(chosen))}</b>
            </div>
            <button className="btn-black" disabled={!chosen.length} onClick={order}>
              {chosen.length}개 주문하기
            </button>
            <p className="muted small">가격은 주문할 때 다시 확인해요.</p>
          </aside>
        </div>
      )}
    </Page>
  )
}

const EMPTY_ADDR = { name: '', phone: '', zip: '', addr1: '', addr2: '' }

// 다음(카카오) 우편번호 — 무료, 키 없음
let postcodeLoading = null
const openPostcode = (onPick) => {
  postcodeLoading ??= new Promise((resolve, reject) => {
    if (window.daum?.Postcode) return resolve()
    const s = document.createElement('script')
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    s.onload = resolve
    s.onerror = () => {
      postcodeLoading = null
      reject(new Error('우편번호 찾기를 불러오지 못했어요'))
    }
    document.head.appendChild(s)
  })
  // 새 창 대신 화면 위 레이어로 (모바일 · 팝업 차단에서도 동작)
  return postcodeLoading.then(() => {
    const layer = document.createElement('div')
    layer.className = 'postcode-layer'
    layer.innerHTML = '<div class="postcode-box"><button type="button" class="postcode-close">닫기</button><div class="postcode-body"></div></div>'
    const close = () => layer.remove()
    layer.querySelector('.postcode-close').onclick = close
    layer.onclick = (e) => e.target === layer && close()
    document.body.appendChild(layer)
    new window.daum.Postcode({
      oncomplete: (d) => {
        onPick({ zip: d.zonecode, addr1: d.roadAddress || d.jibunAddress })
        close()
      },
      width: '100%',
      height: '100%',
    }).embed(layer.querySelector('.postcode-body'))
  })
}

export function AddressFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="fields">
      <label>
        받는 분
        <input value={value.name} onChange={set('name')} maxLength={30} />
      </label>
      <label>
        휴대폰
        <input value={value.phone} onChange={set('phone')} inputMode="tel" placeholder="010-0000-0000" />
      </label>
      <label>
        주소
        <span className="row-input">
          <input value={value.zip} readOnly placeholder="우편번호" className="zip" />
          <button type="button" className="btn-line small" onClick={() => openPostcode((a) => onChange({ ...value, ...a })).catch((e) => alert(e.message))}>
            우편번호 찾기
          </button>
        </span>
        <input value={value.addr1} readOnly placeholder="기본 주소" />
        <input value={value.addr2} onChange={set('addr2')} placeholder="상세 주소" maxLength={100} />
      </label>
    </div>
  )
}

// 주문서 /order/checkout — 주문 상품 · 배송지 · 개인통관고유부호 · 결제수단 · 동의 → 결제
export function CheckoutPage() {
  const member = useMember()
  const lines = useMemo(() => getBuyNow() || [], [])
  const [addrs, setAddrs] = useState([])
  const [addrId, setAddrId] = useState('new')
  const [addr, setAddr] = useState(EMPTY_ADDR)
  const [saveAddr, setSaveAddr] = useState(true)
  const [memo, setMemo] = useState('')
  const [pccc, setPccc] = useState('')
  const [savePccc, setSavePccc] = useState(true)
  const [pay, setPay] = useState('')
  const [cfg, setCfg] = useState(null)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (member === null) navigate(`/login?next=${encodeURIComponent('/order/checkout')}`, { replace: true })
    if (!member) return
    listAddresses().then((list) => {
      setAddrs(list)
      const def = list.find((a) => a.is_default)
      if (def) {
        setAddrId(String(def.id))
        setAddr(def)
      }
    })
    getProfile().then((p) => {
      if (p.pccc) setPccc(p.pccc)
      if (!addr.name) setAddr((a) => ({ ...a, name: a.name || p.name, phone: a.phone || p.phone || '' }))
    })
    getPayConfig().then((c) => {
      setCfg(c)
      setPay(c.kakao.enabled ? 'kakao' : c.naver.enabled ? 'naver' : '')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member])

  if (!lines.length)
    return (
      <Page narrow>
        <h1 className="page-title">주문서</h1>
        <p className="empty">주문할 상품이 없어요.</p>
        <Link to="/cart">장바구니로</Link>
      </Page>
    )

  const total = sum(lines)
  const submit = async () => {
    setError('')
    if (!pay) return setError('결제 수단을 골라 주세요')
    if (!agree) return setError('주문 내용과 해외구매대행 안내에 동의해 주세요')
    setBusy(true)
    try {
      const order = await createOrder(
        lines.map((l) => ({ sku: l.sku, qty: l.qty })),
        {
          shipping: { name: addr.name, phone: addr.phone, zip: addr.zip, addr1: addr.addr1, addr2: addr.addr2 },
          pccc,
          memo,
          agree: true,
          save_address: addrId === 'new' && saveAddr,
          save_pccc: savePccc,
        },
      )
      sessionStorage.setItem('shop.checkoutFrom', new URLSearchParams(window.location.search).get('buy') || '')
      sessionStorage.setItem('shop.checkoutSkus', JSON.stringify(lines.map((l) => l.sku)))
      if (pay === 'kakao') await payWithKakao(order.code)
      else await payWithNaver(order.code)
      // 결제창으로 넘어가지 못했으면 (팝업 차단 등) 다시 누를 수 있게
      setTimeout(() => setBusy(false), 6000)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Page>
      <h1 className="page-title">주문서</h1>
      <div className="two-col">
        <div className="sections">
          <section>
            <h2>주문 상품 {lines.length}개</h2>
            {lines.map((l) => (
              <div className="line compact" key={l.sku}>
                <img src={l.img} alt="" />
                <div className="line-body">
                  <div className="name">{l.name}</div>
                  <div className="muted">
                    {l.option} · {l.qty}개
                  </div>
                </div>
                <b>{won(l.price * l.qty)}</b>
              </div>
            ))}
          </section>

          <section>
            <h2>배송 정보</h2>
            {addrs.length > 0 && (
              <div className="addr-tabs">
                {addrs.map((a) => (
                  <button
                    key={a.id}
                    className={addrId === String(a.id) ? 'on' : ''}
                    onClick={() => {
                      setAddrId(String(a.id))
                      setAddr(a)
                    }}
                  >
                    {a.label || a.name}
                    {a.is_default ? ' (기본)' : ''}
                  </button>
                ))}
                <button
                  className={addrId === 'new' ? 'on' : ''}
                  onClick={() => {
                    setAddrId('new')
                    setAddr(EMPTY_ADDR)
                  }}
                >
                  새로 입력
                </button>
              </div>
            )}
            <AddressFields value={addr} onChange={(v) => setAddr(v)} />
            {addrId === 'new' && (
              <label className="check">
                <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> 내 배송지에 저장
              </label>
            )}
            <label className="field">
              배송 메모
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 문 앞에 놓아 주세요" maxLength={100} />
            </label>
          </section>

          <section>
            <h2>개인통관고유부호</h2>
            <p className="muted small">
              해외에서 받는 분 이름으로 통관해요. 받는 분과 같은 사람의 부호여야 해요.{' '}
              <a href="https://unipass.customs.go.kr/csp/persIndex.do" target="_blank" rel="noreferrer">
                발급·조회 (관세청)
              </a>
            </p>
            <input className="input" value={pccc} onChange={(e) => setPccc(e.target.value.toUpperCase())} placeholder="P로 시작하는 13자리" maxLength={13} />
            <label className="check">
              <input type="checkbox" checked={savePccc} onChange={(e) => setSavePccc(e.target.checked)} /> 회원정보에 저장
            </label>
          </section>

          <section>
            <h2>결제 수단</h2>
            <div className="pay-pick">
              {[
                ['kakao', '카카오페이'],
                ['naver', '네이버페이'],
              ].map(([k, label]) => (
                <button key={k} className={`${pay === k ? 'on' : ''} ${k}`} disabled={!cfg?.[k]?.enabled} onClick={() => setPay(k)}>
                  {label}
                </button>
              ))}
            </div>
            {cfg && (cfg.kakao.test || cfg.naver.test) && <p className="muted small">테스트 결제예요 — 실제로 돈이 나가지 않아요.</p>}
          </section>
        </div>

        <aside className="summary">
          <h2>결제 금액</h2>
          <dl>
            <dt>상품 금액</dt>
            <dd>{won(total)}</dd>
            <dt>배송비</dt>
            <dd>무료</dd>
          </dl>
          <div className="summary-total">
            <span>최종 결제 금액</span>
            <b>{won(total)}</b>
          </div>
          <label className="check agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              주문 내용을 확인했고, 해외구매대행 상품으로 받는 분 이름의 개인통관고유부호로 통관하는 데 동의해요.{' '}
              <Link to="/guide">안내 보기</Link>
            </span>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn-black" disabled={busy} onClick={submit}>
            {busy ? '결제창 여는 중…' : `${won(total)} 결제하기`}
          </button>
        </aside>
      </div>
    </Page>
  )
}

// 주문 완료 /order/complete?order=
export function OrderCompletePage({ query }) {
  const code = query.get('order')
  const [o, setO] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    // 장바구니에서 주문했으면 주문한 줄만 장바구니에서 뺀다
    if (sessionStorage.getItem('shop.checkoutFrom') === 'cart') {
      try {
        removeFromCart(JSON.parse(sessionStorage.getItem('shop.checkoutSkus')) || [])
      } catch {
        clearCart()
      }
    }
    sessionStorage.removeItem('shop.checkoutFrom')
    myOrder(code)
      .then(setO)
      .catch((e) => setError(e.message))
  }, [code])
  return (
    <Page narrow>
      <div className="done">
        <h1>{o?.status === 'paid' ? '주문이 완료됐어요' : '주문 확인'}</h1>
        {error && <p className="error">{error}</p>}
        {o && (
          <>
            <p className="muted">
              주문번호 {o.code} · {PROGRESS[o.progress]} · {PAY_METHOD[o.provider] || ''}
              {o.test ? ' (테스트)' : ''}
            </p>
            <dl className="kv">
              <dt>상품</dt>
              <dd>{o.item_name}</dd>
              <dt>결제 금액</dt>
              <dd>{won(o.total_amount)}</dd>
              <dt>받는 분</dt>
              <dd>
                {o.shipping?.name} · {o.shipping?.addr1} {o.shipping?.addr2}
              </dd>
            </dl>
          </>
        )}
        <div className="done-links">
          <Link className="btn-black inline" to={`/my/orders/${code}`}>
            주문 상세 보기
          </Link>
          <Link className="btn-line inline" to="/products">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </Page>
  )
}
