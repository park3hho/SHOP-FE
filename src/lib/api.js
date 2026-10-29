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
export const listProducts = (q = '', page = 1, size = 40) =>
  call(`/products?page=${page}&size=${size}${q ? `&q=${encodeURIComponent(q)}` : ''}`)
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
export const withdraw = async (password) => {
  await call('/me/withdraw', { body: { password } })
  setMember(null)
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
export const PAY_METHOD = { kakao: '카카오페이', naver: '네이버페이' }
export const kst = (iso) =>
  iso
    ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16).replace('T', ' ')
    : ''
