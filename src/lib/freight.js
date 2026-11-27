// 장바구니 해외 배송비 (예상, 2026-11-27) — 서버 스위치(config.freight.enabled)가 켜져 있을 때만.
// SHOP-BE POST /cart/freight → AGC 운임 계산기(집운 상자 구성 최적화). 담은 게 바뀌면 0.3초 뒤 다시 계산.
import { useEffect, useState } from 'react'

import { getPayConfig } from './payments'

// 직원 미리보기: 그 기기에서 ?eido_freight=1 한 번 열면 서버 스위치가 꺼져 있어도 보임 (끄기 ?eido_freight=0)
const preview = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('eido_freight')
    if (q === '1') localStorage.setItem('shop.freightPreview', '1')
    else if (q === '0') localStorage.removeItem('shop.freightPreview')
    return localStorage.getItem('shop.freightPreview') === '1'
  } catch {
    return false
  }
}
let onPromise = null
const freightOn = () =>
  (onPromise ||= getPayConfig()
    .then((c) => !!c.freight?.enabled || preview())
    .catch(() => preview()))

async function fetchFreight(items) {
  const res = await fetch('/api/shop/cart/freight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items.map((i) => ({ sku: i.sku, qty: i.qty })) }),
  })
  if (!res.ok) throw new Error('배송비를 계산하지 못했어요')
  return res.json() // { fee, weight_g, units, avg, boxes:[{weight_g, billable_kg, fee}] }
}

/** items: 장바구니 줄 → { on, loading, data } (꺼져 있으면 on=false) */
export function useFreight(items) {
  const [on, setOn] = useState(false)
  const [state, setState] = useState({ loading: false, data: null })
  const key = items.map((i) => `${i.sku}:${i.qty}`).join(',')
  useEffect(() => {
    freightOn().then(setOn)
  }, [])
  useEffect(() => {
    if (!on || !items.length) return setState({ loading: false, data: null })
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    const t = setTimeout(() => {
      fetchFreight(items)
        .then((d) => alive && setState({ loading: false, data: d }))
        .catch(() => alive && setState({ loading: false, data: null }))
    }, 300)
    return () => {
      alive = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, key])
  return { on, ...state }
}

export const kgText = (g) => `${(g / 1000).toFixed(1)}kg`
