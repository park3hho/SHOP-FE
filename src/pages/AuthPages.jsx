import { useEffect, useState } from 'react'

import { Page } from '../components/Layout'
import { getProviders, login, signup, SOCIAL, socialComplete, socialPending, socialStartUrl } from '../lib/api'
import { Link, navigate } from '../lib/router'

// 카카오 · 네이버 로고 (각 사 디자인 가이드 — 카카오 #FEE500 말풍선 · 네이버 #03C75A N)
function KakaoLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#000"
        d="M12 3C6.48 3 2 6.54 2 10.9c0 2.82 1.87 5.29 4.69 6.69l-.95 3.48c-.08.3.26.54.52.37l4.15-2.75c.52.07 1.05.11 1.59.11 5.52 0 10-3.54 10-7.9S17.52 3 12 3z"
      />
    </svg>
  )
}
function NaverLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M16.27 12.84 7.46 0H0v24h7.73V11.16L16.54 24H24V0h-7.73z" />
    </svg>
  )
}

// "카카오로 시작하기" · "네이버로 시작하기" — 키가 아직 없는 곳은 눌러도 '준비 중' 안내
export function SocialButtons({ next = '/my' }) {
  const [ready, setReady] = useState(null)
  useEffect(() => {
    getProviders()
      .then(setReady)
      .catch(() => setReady({}))
  }, [])
  return (
    <div className="social-btns">
      <a className="social-btn kakao" href={socialStartUrl('kakao', next)}>
        <KakaoLogo />
        카카오로 시작하기
      </a>
      <a className="social-btn naver" href={socialStartUrl('naver', next)}>
        <NaverLogo />
        네이버로 시작하기
      </a>
      {ready && Object.entries(ready).some(([, v]) => !v.ready) && (
        <p className="muted small">
          {Object.entries(ready)
            .filter(([, v]) => !v.ready)
            .map(([k]) => SOCIAL[k]?.label)
            .join(' · ')}{' '}
          로그인은 준비 중이에요
        </p>
      )}
      <div className="or-line">
        <span>또는 이메일로</span>
      </div>
    </div>
  )
}

// 서버가 돌려보낸 소셜 로그인 결과 안내 (?social=…&provider=…)
const SOCIAL_MSG = {
  cancelled: (p) => `${p} 로그인을 취소했어요.`,
  expired: (p) => `${p} 로그인 시간이 지났어요. 다시 눌러 주세요.`,
  failed: (p) => `${p} 로그인에 실패했어요. 잠시 뒤 다시 해 주세요.`,
  not_ready: (p) => `${p} 로그인은 준비 중이에요. 이메일로 로그인해 주세요.`,
  email_taken: (p) =>
    `같은 이메일로 가입한 계정이 있어요. 이메일로 로그인한 뒤 마이페이지 › 회원정보에서 ${p} 계정을 연결해 주세요.`,
}
const socialNotice = (query) => {
  const k = query.get('social')
  const p = SOCIAL[query.get('provider')]?.label || '소셜'
  return k && SOCIAL_MSG[k] ? SOCIAL_MSG[k](p) : ''
}

const safeNext = (q) => {
  const n = q.get('next') || '/my'
  return n.startsWith('/') && !n.startsWith('//') ? n : '/my'
}

// 로그인 /login?next=
export function LoginPage({ query }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const next = safeNext(query)
  const notice = socialNotice(query)
  return (
    <Page narrow>
      <form
        className="auth"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            await login(email, pw)
            navigate(next, { replace: true })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <h1>로그인</h1>
        {notice && <p className="notice">{notice}</p>}
        <SocialButtons next={next} />
        <input className="input" type="email" autoComplete="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" autoComplete="current-password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button className="btn-black" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </button>
        <p className="auth-links">
          처음이세요? <Link to={`/signup?next=${encodeURIComponent(next)}`}>회원가입</Link>
        </p>
      </form>
    </Page>
  )
}

// 회원가입 /signup — 이메일 · 비밀번호 · 이름 · 휴대폰(선택) + 필수 약관 3 · 광고 수신(선택)
export function SignupPage({ query }) {
  const [f, setF] = useState({ email: '', password: '', password2: '', name: '', phone: '' })
  const [ag, setAg] = useState({ terms: false, privacy: false, age: false, marketing: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const allOn = ag.terms && ag.privacy && ag.age && ag.marketing
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.password2) return setError('비밀번호가 서로 달라요')
    if (!(ag.terms && ag.privacy && ag.age)) return setError('필수 약관에 모두 동의해 주세요')
    setBusy(true)
    try {
      await signup({
        email: f.email,
        password: f.password,
        name: f.name,
        phone: f.phone || null,
        agree_terms: ag.terms,
        agree_privacy: ag.privacy,
        agree_age: ag.age,
        marketing: ag.marketing,
      })
      navigate(safeNext(query), { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  const box = (k, label, link) => (
    <label className="check">
      <input type="checkbox" checked={ag[k]} onChange={(e) => setAg({ ...ag, [k]: e.target.checked })} />
      <span>
        {label} {link && <Link to={link}>보기</Link>}
      </span>
    </label>
  )
  return (
    <Page narrow>
      <form className="auth" onSubmit={submit}>
        <h1>회원가입</h1>
        <SocialButtons next={safeNext(query)} />
        <input className="input" type="email" autoComplete="email" placeholder="이메일" value={f.email} onChange={set('email')} required />
        <input className="input" type="password" autoComplete="new-password" placeholder="비밀번호 (영문·숫자 8자 이상)" value={f.password} onChange={set('password')} required />
        <input className="input" type="password" autoComplete="new-password" placeholder="비밀번호 확인" value={f.password2} onChange={set('password2')} required />
        <input className="input" autoComplete="name" placeholder="이름" value={f.name} onChange={set('name')} required maxLength={50} />
        <input className="input" type="tel" autoComplete="tel" placeholder="휴대폰 (선택)" value={f.phone} onChange={set('phone')} />
        <div className="agree-box">
          <label className="check all">
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => setAg({ terms: e.target.checked, privacy: e.target.checked, age: e.target.checked, marketing: e.target.checked })}
            />
            <b>전체 동의</b>
          </label>
          {box('terms', '(필수) 이용약관', '/terms')}
          {box('privacy', '(필수) 개인정보 수집 · 이용', '/privacy')}
          {box('age', '(필수) 만 14세 이상이에요')}
          {box('marketing', '(선택) 할인 · 이벤트 소식 받기')}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn-black" disabled={busy}>
          {busy ? '가입 중…' : '가입하기'}
        </button>
        <p className="auth-links">
          이미 회원이세요? <Link to={`/login?next=${encodeURIComponent(safeNext(query))}`}>로그인</Link>
        </p>
      </form>
    </Page>
  )
}

// 소셜 가입 마무리 /signup/social — 카카오·네이버에서 돌아온 처음 회원. 이름 확인 + 휴대폰(선택) + 필수 약관 3 · 광고(선택)
//   서버가 대기 쿠키(15분)에 계정을 들고 있다 — 없으면 처음부터 다시
export function SocialSignupPage() {
  const [pd, setPd] = useState(undefined) // undefined 확인 중 · null 없음
  const [f, setF] = useState({ name: '', phone: '' })
  const [ag, setAg] = useState({ terms: false, privacy: false, age: false, marketing: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    socialPending()
      .then((p) => {
        setPd(p)
        if (p) setF((x) => ({ ...x, name: p.name || '' }))
      })
      .catch(() => setPd(null))
  }, [])
  const allOn = ag.terms && ag.privacy && ag.age && ag.marketing
  const box = (k, label, link) => (
    <label className="check">
      <input type="checkbox" checked={ag[k]} onChange={(e) => setAg({ ...ag, [k]: e.target.checked })} />
      <span>
        {label} {link && <Link to={link}>보기</Link>}
      </span>
    </label>
  )
  if (pd === undefined) return <Page narrow />
  if (pd === null)
    return (
      <Page narrow>
        <div className="auth">
          <h1>가입 시간이 지났어요</h1>
          <p className="muted">카카오 · 네이버로 다시 시작해 주세요.</p>
          <SocialButtons />
          <Link className="btn-line" to="/signup">
            이메일로 가입하기
          </Link>
        </div>
      </Page>
    )
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!(ag.terms && ag.privacy && ag.age)) return setError('필수 약관에 모두 동의해 주세요')
    setBusy(true)
    try {
      const d = await socialComplete({
        name: f.name,
        phone: f.phone || null,
        agree_terms: ag.terms,
        agree_privacy: ag.privacy,
        agree_age: ag.age,
        marketing: ag.marketing,
      })
      navigate(d.next || '/my', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <Page narrow>
      <form className="auth" onSubmit={submit}>
        <h1>{pd.label}로 가입하기</h1>
        <p className="muted">
          {pd.email ? `${pd.email} · ` : ''}마지막으로 이름을 확인하고 약관에 동의해 주세요.
        </p>
        <input className="input" autoComplete="name" placeholder="이름" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={50} />
        <input className="input" type="tel" autoComplete="tel" placeholder="휴대폰 (선택)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <div className="agree-box">
          <label className="check all">
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => setAg({ terms: e.target.checked, privacy: e.target.checked, age: e.target.checked, marketing: e.target.checked })}
            />
            <b>전체 동의</b>
          </label>
          {box('terms', '(필수) 이용약관', '/terms')}
          {box('privacy', '(필수) 개인정보 수집 · 이용', '/privacy')}
          {box('age', '(필수) 만 14세 이상이에요')}
          {box('marketing', '(선택) 할인 · 이벤트 소식 받기')}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn-black" disabled={busy}>
          {busy ? '가입 중…' : '가입 마치기'}
        </button>
      </form>
    </Page>
  )
}
