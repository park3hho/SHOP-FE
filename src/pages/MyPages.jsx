import { useEffect, useState } from 'react'

import { Page } from '../components/Layout'
import {
  cancelMyOrder,
  changePassword,
  createPassword,
  deleteAddress,
  getProfileFull,
  kst,
  listAddresses,
  logout,
  myOrder,
  myOrders,
  PAY_METHOD,
  PROGRESS,
  saveAddress,
  SOCIAL,
  socialStartUrl,
  unlinkSocial,
  updateProfile,
  useMember,
  withdraw,
  won,
} from '../lib/api'
import { Link, navigate } from '../lib/router'
import { AddressFields } from './OrderPages'

const MENU = [
  { group: '나의 쇼핑', items: [{ to: '/my/orders', label: '주문 · 배송 조회' }] },
  {
    group: '나의 정보',
    items: [
      { to: '/my/profile', label: '회원정보 수정' },
      { to: '/my/addresses', label: '배송지 관리' },
      { to: '/my/password', label: '비밀번호 변경' },
    ],
  },
]
// 마이페이지 첫 화면 숫자 — 배송 단계(delivery.level 0~7)를 4칸으로 묶는다
const HOME_STEPS = [
  { label: '결제 완료', has: (l) => l === 0 },
  { label: '주문 확인', has: (l) => l === 1 },
  { label: '배송 중', has: (l) => l >= 2 && l <= 6 },
  { label: '배송 완료', has: (l) => l === 7 },
]
const stateLabel = (o) => (o.progress === 'cancelled' || !o.delivery ? PROGRESS[o.progress] : o.delivery.label)

// 마이페이지 틀 — 왼쪽 메뉴 + 오른쪽 내용. 로그인 안 했으면 로그인으로
function MyLayout({ path, title, children }) {
  const member = useMember()
  useEffect(() => {
    if (member === null) navigate(`/login?next=${encodeURIComponent(path)}`, { replace: true })
  }, [member, path])
  if (!member) return <Page>불러오는 중…</Page>
  return (
    <Page>
      <div className="my">
        <aside className="my-side">
          <Link className="my-name" to="/my">
            <b>{member.name}</b>님
          </Link>
          {MENU.map((g) => (
            <div key={g.group} className="my-group">
              <div className="my-group-title">{g.group}</div>
              {g.items.map((i) => (
                <Link key={i.to} to={i.to} className={path.startsWith(i.to) ? 'on' : ''}>
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
          <button
            className="text-btn"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            로그아웃
          </button>
        </aside>
        <section className="my-main">
          {title && <h1 className="page-title">{title}</h1>}
          {children}
        </section>
      </div>
    </Page>
  )
}

function useOrders() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    myOrders()
      .then(setItems)
      .catch((e) => setError(e.message))
  }, [])
  return { items, error }
}

function OrderRow({ o }) {
  return (
    <Link className="order-row" to={`/my/orders/${o.code}`}>
      <div className="order-img">{o.items[0]?.img && <img src={o.items[0].img} alt="" />}</div>
      <div className="order-body">
        <div className="muted small">
          {kst(o.created_at)} · {o.code}
        </div>
        <div className="name">{o.item_name}</div>
        <div>
          {won(o.total_amount)} · {o.quantity}개
        </div>
      </div>
      <div className={`order-state st-${o.progress}`}>{stateLabel(o)}</div>
    </Link>
  )
}

// /my — 진행 상태 숫자 + 최근 주문
export function MyHomePage() {
  const { items, error } = useOrders()
  const count = (s) => (items || []).filter((o) => o.progress !== 'cancelled' && o.delivery && s.has(o.delivery.level)).length
  return (
    <MyLayout path="/my">
      <div className="my-steps">
        {HOME_STEPS.map((s) => (
          <div key={s.label}>
            <b>{count(s)}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="my-section-head">
        <h2>최근 주문</h2>
        <Link to="/my/orders">전체 보기</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {items && !items.length && <p className="empty">아직 주문이 없어요.</p>}
      {(items || []).slice(0, 5).map((o) => (
        <OrderRow key={o.code} o={o} />
      ))}
    </MyLayout>
  )
}

// /my/orders — 전체 주문 (상태 탭)
export function MyOrdersPage() {
  const { items, error } = useOrders()
  const [tab, setTab] = useState('all')
  const list = (items || []).filter((o) => tab === 'all' || (tab === 'cancelled' ? o.progress === 'cancelled' : o.progress !== 'cancelled'))
  return (
    <MyLayout path="/my/orders" title="주문 · 배송 조회">
      <div className="text-tabs">
        {[
          ['all', '전체'],
          ['active', '진행 중'],
          ['cancelled', '취소'],
        ].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {items && !list.length && <p className="empty">주문이 없어요.</p>}
      {list.map((o) => (
        <OrderRow key={o.code} o={o} />
      ))}
    </MyLayout>
  )
}

// /my/orders/:code — 진행 단계 · 상품 · 배송지 · 결제 · 취소
export function MyOrderPage({ code }) {
  const [o, setO] = useState(null)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('단순 변심')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    myOrder(code)
      .then(setO)
      .catch((e) => setError(e.message))
  }, [code])
  return (
    <MyLayout path="/my/orders" title="주문 상세">
      {error && <p className="error">{error}</p>}
      {o && (
        <>
          <p className="muted">
            {kst(o.created_at)} 주문 · {o.code}
            {o.test ? ' · 테스트 결제' : ''}
          </p>
          {o.progress === 'cancelled' ? (
            <p className="cancel-note">주문이 취소됐어요 ({kst(o.cancelled_at)}) — 결제 금액은 결제수단으로 돌려드렸어요.</p>
          ) : (
            o.delivery && <DeliverySteps d={o.delivery} />
          )}
          <h2 className="sub-title">주문 상품</h2>
          {o.items.map((it) => (
            <div className="line compact" key={it.sku}>
              {it.img ? <img src={it.img} alt="" /> : <span className="noimg" />}
              <div className="line-body">
                <div className="name">{it.name}</div>
                <div className="muted">
                  {won(it.unit_price)} · {it.qty}개
                </div>
              </div>
              <b>{won(it.amount)}</b>
            </div>
          ))}
          <h2 className="sub-title">배송지</h2>
          <dl className="kv">
            <dt>받는 분</dt>
            <dd>
              {o.shipping?.name} · {o.shipping?.phone}
            </dd>
            <dt>주소</dt>
            <dd>
              ({o.shipping?.zip}) {o.shipping?.addr1} {o.shipping?.addr2}
            </dd>
            {o.shipping?.memo && (
              <>
                <dt>메모</dt>
                <dd>{o.shipping.memo}</dd>
              </>
            )}
            <dt>통관부호</dt>
            <dd>{o.pccc}</dd>
          </dl>
          <h2 className="sub-title">결제</h2>
          <dl className="kv">
            <dt>결제 수단</dt>
            <dd>{PAY_METHOD[o.provider] || '-'}</dd>
            <dt>결제 금액</dt>
            <dd>
              <b>{won(o.total_amount)}</b> (배송비 무료)
            </dd>
            <dt>결제 시각</dt>
            <dd>{kst(o.paid_at) || '-'}</dd>
          </dl>
          {o.can_cancel && (
            <div className="cancel-box">
              <h2 className="sub-title">주문 취소</h2>
              <p className="muted small">상품 준비 전이라 바로 취소되고, 결제 금액은 전액 돌려드려요.</p>
              <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {['단순 변심', '주문 실수', '배송이 오래 걸려서', '기타'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                className="btn-line"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm('이 주문을 취소할까요?')) return
                  setBusy(true)
                  try {
                    setO(await cancelMyOrder(o.code, reason))
                  } catch (e) {
                    setError(e.message)
                  }
                  setBusy(false)
                }}
              >
                {busy ? '취소 중…' : '주문 취소하기'}
              </button>
            </div>
          )}
        </>
      )}
      <p>
        <Link to="/my/orders">← 주문 목록</Link>
      </p>
    </MyLayout>
  )
}

// /my/addresses — 배송지 목록 · 추가 · 수정 · 기본 · 삭제
export function MyAddressesPage() {
  const [items, setItems] = useState(null)
  const [edit, setEdit] = useState(null) // null · {} 새로 · {id,…} 수정
  const [error, setError] = useState('')
  const load = () => listAddresses().then(setItems).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])
  return (
    <MyLayout path="/my/addresses" title="배송지 관리">
      {error && <p className="error">{error}</p>}
      {(items || []).map((a) => (
        <div className="addr-row" key={a.id}>
          <div>
            <b>{a.label || a.name}</b> {a.is_default && <span className="tag">기본</span>}
            <div>
              {a.name} · {a.phone}
            </div>
            <div className="muted">
              ({a.zip}) {a.addr1} {a.addr2}
            </div>
          </div>
          <div className="addr-actions">
            {!a.is_default && (
              <button className="text-btn" onClick={() => saveAddress({ ...a, is_default: true }).then(load)}>
                기본으로
              </button>
            )}
            <button className="text-btn" onClick={() => setEdit(a)}>
              수정
            </button>
            <button
              className="text-btn"
              onClick={() => window.confirm('이 배송지를 지울까요?') && deleteAddress(a.id).then(load)}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
      {items && !items.length && !edit && <p className="empty">저장한 배송지가 없어요.</p>}
      {edit ? (
        <div className="edit-box">
          <label className="field">
            배송지 이름
            <input value={edit.label || ''} onChange={(e) => setEdit({ ...edit, label: e.target.value })} placeholder="예: 집" maxLength={30} />
          </label>
          <AddressFields value={{ name: '', phone: '', zip: '', addr1: '', addr2: '', ...edit }} onChange={(v) => setEdit({ ...edit, ...v })} />
          <label className="check">
            <input type="checkbox" checked={!!edit.is_default} onChange={(e) => setEdit({ ...edit, is_default: e.target.checked })} /> 기본 배송지로
          </label>
          <div className="row-buttons">
            <button className="btn-line" onClick={() => setEdit(null)}>
              취소
            </button>
            <button
              className="btn-black"
              onClick={async () => {
                setError('')
                try {
                  await saveAddress(edit)
                  setEdit(null)
                  load()
                } catch (e) {
                  setError(e.message)
                }
              }}
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-line" onClick={() => setEdit({})}>
          + 배송지 추가
        </button>
      )}
    </MyLayout>
  )
}

// 마이페이지 › 회원정보 › 연결된 계정 — 카카오 · 네이버 연결 · 해제
//   서버가 돌려보낸 결과: ?linked=kakao · ?social=taken|already&provider=…
const LINK_MSG = {
  taken: (p) => `이 ${p} 계정은 다른 회원에 연결돼 있어요.`,
  already: (p) => `이미 다른 ${p} 계정이 연결돼 있어요. 해제한 뒤 다시 연결해 주세요.`,
}
function SocialLinks({ socials, providers, onChange }) {
  const [error, setError] = useState('')
  const q = new URLSearchParams(window.location.search)
  const label = SOCIAL[q.get('provider') || q.get('linked')]?.label || ''
  const notice = q.get('linked') ? `${label} 계정을 연결했어요.` : LINK_MSG[q.get('social')]?.(label) || ''
  return (
    <div className="social-links">
      <h3>연결된 계정</h3>
      {notice && <p className="notice">{notice}</p>}
      {Object.keys(SOCIAL).map((k) => {
        const s = socials.find((x) => x.provider === k)
        return (
          <div key={k} className="social-link-row">
            <span className={`social-dot ${k}`} />
            <b>{SOCIAL[k].label}</b>
            <span className="muted small">{s ? `연결됨 ${s.email ? `· ${s.email}` : ''}` : '연결 안 됨'}</span>
            {s ? (
              <button
                className="btn-line small"
                onClick={async () => {
                  if (!window.confirm(`${SOCIAL[k].label} 연결을 해제할까요?`)) return
                  setError('')
                  try {
                    onChange(await unlinkSocial(k))
                  } catch (e) {
                    setError(e.message)
                  }
                }}
              >
                해제
              </button>
            ) : providers?.[k]?.ready === false ? (
              <span className="muted small">준비 중</span>
            ) : (
              <a className="btn-line small" href={socialStartUrl(k, '/my/profile', 'link')}>
                연결
              </a>
            )}
          </div>
        )
      })}
      {error && <p className="error">{error}</p>}
    </div>
  )
}

// /my/profile — 이름 · 휴대폰 · 개인통관고유부호 · 광고 수신 · 연결된 계정 · 탈퇴
export function MyProfilePage() {
  const [p, setP] = useState(null)
  const [socials, setSocials] = useState([])
  const [providers, setProviders] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [wpw, setWpw] = useState('')
  const [wok, setWok] = useState(false) // 소셜만 가입한 회원의 탈퇴 확인
  useEffect(() => {
    getProfileFull()
      .then((d) => {
        setP({ ...d.member, phone: d.member.phone || '', pccc: d.member.pccc || '' })
        setSocials(d.socials || [])
        setProviders(d.providers || null)
      })
      .catch((e) => setError(e.message))
  }, [])
  const set = (k) => (e) => setP({ ...p, [k]: k === 'pccc' ? e.target.value.toUpperCase() : e.target.value })
  return (
    <MyLayout path="/my/profile" title="회원정보 수정">
      {error && <p className="error">{error}</p>}
      {p && (
        <div className="fields">
          <label>
            이메일
            <input value={p.email || '없음 (소셜로 가입)'} readOnly />
          </label>
          <label>
            이름
            <input value={p.name} onChange={set('name')} maxLength={50} />
          </label>
          <label>
            휴대폰
            <input value={p.phone} onChange={set('phone')} inputMode="tel" />
          </label>
          <label>
            개인통관고유부호
            <input value={p.pccc} onChange={set('pccc')} placeholder="P로 시작하는 13자리" maxLength={13} />
          </label>
          <label className="check">
            <input type="checkbox" checked={p.marketing} onChange={(e) => setP({ ...p, marketing: e.target.checked })} /> 할인 · 이벤트 소식 받기
          </label>
          <button
            className="btn-black"
            onClick={async () => {
              setError('')
              setMsg('')
              try {
                const body = { name: p.name, marketing: p.marketing }
                if (p.phone) body.phone = p.phone
                if (p.pccc) body.pccc = p.pccc
                await updateProfile(body)
                setMsg('저장했어요')
              } catch (e) {
                setError(e.message)
              }
            }}
          >
            저장
          </button>
          {msg && <p className="hint">{msg}</p>}
          <SocialLinks socials={socials} providers={providers} onChange={setSocials} />
          <details className="withdraw">
            <summary>회원 탈퇴</summary>
            <p className="muted small">탈퇴하면 배송지와 회원정보가 지워져요. 주문 기록은 법에 따라 5년 보관해요.</p>
            {p.has_password ? (
              <input className="input" type="password" placeholder="비밀번호" value={wpw} onChange={(e) => setWpw(e.target.value)} />
            ) : (
              <label className="check">
                <input type="checkbox" checked={wok} onChange={(e) => setWok(e.target.checked)} /> 위 내용을 확인했고 탈퇴할게요
              </label>
            )}
            <button
              className="btn-line"
              onClick={async () => {
                if (!window.confirm('정말 탈퇴할까요?')) return
                try {
                  await withdraw(wpw, wok)
                  navigate('/')
                } catch (e) {
                  setError(e.message)
                }
              }}
            >
              탈퇴하기
            </button>
          </details>
        </div>
      )}
    </MyLayout>
  )
}

// /my/password — 소셜로만 가입한 회원(비밀번호 없음)은 '비밀번호 만들기' (이메일이 없으면 로그인용 이메일도)
export function MyPasswordPage() {
  const member = useMember()
  if (member && member.has_password === false) return <MyPasswordCreate member={member} />
  return <MyPasswordChange />
}

function MyPasswordCreate({ member }) {
  const [f, setF] = useState({ email: '', next: '', next2: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  return (
    <MyLayout path="/my/password" title="비밀번호 만들기">
      <form
        className="fields"
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          if (f.next !== f.next2) return setError('비밀번호가 서로 달라요')
          try {
            await createPassword(f.next, f.email)
            setMsg('비밀번호를 만들었어요. 이제 이메일로도 로그인할 수 있어요.')
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <p className="muted small">카카오 · 네이버로 가입해서 아직 비밀번호가 없어요. 만들면 이메일로도 로그인할 수 있어요.</p>
        {!member.email && (
          <label>
            로그인에 쓸 이메일
            <input type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          </label>
        )}
        <label>
          비밀번호 (영문·숫자 8자 이상)
          <input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
        </label>
        <label>
          비밀번호 확인
          <input type="password" autoComplete="new-password" value={f.next2} onChange={(e) => setF({ ...f, next2: e.target.value })} />
        </label>
        {error && <p className="error">{error}</p>}
        {msg && <p className="hint">{msg}</p>}
        <button className="btn-black">만들기</button>
      </form>
    </MyLayout>
  )
}

function MyPasswordChange() {
  const [f, setF] = useState({ current: '', next: '', next2: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  return (
    <MyLayout path="/my/password" title="비밀번호 변경">
      <form
        className="fields"
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          setMsg('')
          if (f.next !== f.next2) return setError('새 비밀번호가 서로 달라요')
          try {
            await changePassword(f.current, f.next)
            setMsg('바꿨어요. 다른 기기에서는 다시 로그인해야 해요.')
            setF({ current: '', next: '', next2: '' })
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <label>
          지금 비밀번호
          <input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
        </label>
        <label>
          새 비밀번호 (영문·숫자 8자 이상)
          <input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
        </label>
        <label>
          새 비밀번호 확인
          <input type="password" autoComplete="new-password" value={f.next2} onChange={(e) => setF({ ...f, next2: e.target.value })} />
        </label>
        {error && <p className="error">{error}</p>}
        {msg && <p className="hint">{msg}</p>}
        <button className="btn-black">변경</button>
      </form>
    </MyLayout>
  )
}


// 배송 단계 — 결제 완료부터 배송 완료까지 세로 타임라인 (지난 단계는 시각, 지금 단계는 굵게)
function DeliverySteps({ d }) {
  return (
    <>
      <p className="delivery-now">
        지금 <b>{d.label}</b>
      </p>
      <ol className="track">
        {d.steps.map((s) => (
          <li key={s.key} className={s.current ? 'now' : s.done ? 'on' : ''}>
            <span className="dot" />
            <span className="label">{s.label}</span>
            {s.at && <span className="muted small">{kst(s.at)}</span>}
            {s.key === 'domestic' && s.done && d.domestic && (
              <span className="small">
                {d.domestic.courier} {d.domestic.number}
                {d.domestic.url && (
                  <>
                    {' '}
                    <a href={d.domestic.url} target="_blank" rel="noreferrer">
                      배송 조회
                    </a>
                  </>
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </>
  )
}