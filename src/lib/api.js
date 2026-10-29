// 자사몰 서버(SHOP-BE) — 상품 · 회원 · 배송지 · 내 주문. 결제는 lib/payments.js
// 같은 출처 /api/shop → Vercel rewrite → https://api.eidofood.com/shop (로그인 쿠키 shop_sid 가 1st-party 로 붙는다)
import { useEffect, useState } from 'react'

const API = '/api/shop'

export async function call(path, { method, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data.detail
    const err = new Error(
      typeof d === 'string'
        ? d
        : Array.isArray(d)
          ? '입력값을 확인해 주세요'
          : '서버 요청에 실패했어요',
    )
    err.status = res.status
    throw err
  }
  return data
}

// ── 상품 ──
// filter = { cat, sub, form } — 분류 (AGC 제품 분류, GET /categories)
export const listProducts = (q = '', page = 1, size = 40, filter = {}) => {
  const f = Object.entries(filter)
    .filter(([, v]) => v)
    .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
    .join('')
  return call(`/products?page=${page}&size=${size}${q ? `&q=${encodeURIComponent(q)}` : ''}${f}`)
}

// 메뉴 분류 — 지금 파는 상품이 있는 것만 (서버가 거름). 한 번 받아 모든 화면이 같이 쓴다
let catsPromise = null
export function useCategories() {
  const [cats, setCats] = useState(null)
  useEffect(() => {
    catsPromise ||= call('/categories').then((r) => r.categories).catch(() => (catsPromise = null, []))
    let alive = true
    catsPromise.then((c) => alive && setCats(c))
    return () => {
      alive = false
    }
  }, [])
  return cats
}
export const getProduct = async (code) => (await call(`/products/${encodeURIComponent(code)}`)).product

// ── 회원 (로그인 상태는 앱 전체가 같이 본다) ──
let member // undefined = 아직 모름 · null = 비로그인
const listeners = new Set()
const setMember = (m) => {
  member = m
  listeners.forEach((l) => l(m))
}
export const refreshMember = async () => {
  try {
    setMember((await call('/auth/me')).member)
  } catch {
    setMember(null)
  }
  return member
}
export function useMember() {
  const [m, setM] = useState(member)
  useEffect(() => {
    listeners.add(setM)
    if (member === undefined) refreshMember()
    return () => listeners.delete(setM)
  }, [])
  return m // undefined 면 확인 중
}

export const signup = async (body) => {
  const { member: m } = await call('/auth/signup', { body })
  setMember(m)
  return m
}
export const login = async (email, password) => {
  const { member: m } = await call('/auth/login', { body: { email, password } })
  setMember(m)
  return m
}
export const logout = async () => {
  await call('/auth/logout', { body: {} })
  setMember(null)
}

export const getProfile = async () => (await call('/me/profile')).member
export const updateProfile = async (body) => {
  const m = (await call('/me/profile', { method: 'PATCH', body })).member
  refreshMember()
  return m
}
export const changePassword = (current, next) =>
  call('/me/password', { body: { current, new: next } })
// 소셜로만 가입한 회원은 비밀번호 대신 confirm: true
export const withdraw = async (password, confirm = false) => {
  await call('/me/withdraw', { body: { password: password || null, confirm } })
  setMember(null)
}

// ── 소셜 로그인 (카카오 · 네이버) — 서버가 인가 화면으로 보내고, 돌아오면 next 또는 /signup/social ──
export const SOCIAL = {
  kakao: { label: '카카오' },
  naver: { label: '네이버' },
}
// 이 주소로 화면 전체를 옮긴다 (fetch 가 아니라 window.location) — mode: 'login' | 'link'(마이페이지 연결)
export const socialStartUrl = (provider, next = '/my', mode = 'login') =>
  `${API}/auth/${provider}/start?next=${encodeURIComponent(next)}&mode=${mode}`
export const getProviders = async () => (await call('/auth/providers')).providers
export const socialPending = async () => (await call('/auth/social/pending')).pending
export const socialComplete = async (body) => {
  const d = await call('/auth/social/complete', { body })
  setMember(d.member)
  return d
}
export const getProfileFull = async () => call('/me/profile') // { member, socials, providers }
export const unlinkSocial = async (provider) =>
  (await call(`/me/social/${provider}`, { method: 'DELETE' })).socials
export const createPassword = async (next, email) => {
  const m = (await call('/me/password/create', { body: { new: next, email: email || null } })).member
  refreshMember()
  return m
}

// ── 배송지 ──
export const listAddresses = async () => (await call('/me/addresses')).items
export const saveAddress = async (a) =>
  (await call(a.id ? `/me/addresses/${a.id}` : '/me/addresses', { method: a.id ? 'PUT' : 'POST', body: a }))
    .address
export const deleteAddress = (id) => call(`/me/addresses/${id}`, { method: 'DELETE' })

// ── 내 주문 ──
export const myOrders = async () => (await call('/me/orders')).items
export const myOrder = async (code) => (await call(`/me/orders/${encodeURIComponent(code)}`)).order
export const cancelMyOrder = async (code, reason) =>
  (await call(`/me/orders/${encodeURIComponent(code)}/cancel`, { body: { reason } })).order

// ── 표시 ──
export const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`
export const PROGRESS = {
  pending: '결제 대기',
  paying: '결제 중',
  failed: '결제 실패',
  ordered: '주문 접수',
  preparing: '상품 준비 중',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
}
export const PAY_METHOD = { kakao: '카카오페이', naver: '네이버페이', toss: '신용·체크카드', portone: '신용·체크카드' }
export const kst = (iso) =>
  iso
    ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16).replace('T', ' ')
    : ''
