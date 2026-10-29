import { useState } from 'react'

import { Page } from '../components/Layout'
import { login, signup } from '../lib/api'
import { Link, navigate } from '../lib/router'

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
