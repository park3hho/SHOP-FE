// 장바구니 — 이 브라우저 localStorage. 가격은 표시용(담을 때 값)이고, 주문할 때 서버가 다시 계산한다.
// 한 줄: { sku, code, name, option, price, img, qty }
import { useEffect, useState } from 'react'

const KEY = 'shop.cart'
const MAX_QTY = 10
const listeners = new Set()

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}
const write = (items) => {
  localStorage.setItem(KEY, JSON.stringify(items))
  listeners.forEach((l) => l(items))
}

export const getCart = read
export const addToCart = (line) => {
  const items = read()
  const found = items.find((i) => i.sku === line.sku)
  if (found) found.qty = Math.min(MAX_QTY, found.qty + line.qty)
  else items.push({ ...line, qty: Math.min(MAX_QTY, line.qty) })
  write(items)
}
export const setQty = (sku, qty) =>
  write(read().map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)))
export const removeFromCart = (skus) => write(read().filter((i) => !skus.includes(i.sku)))
export const clearCart = () => write([])

// 바로구매 — 장바구니와 따로, 주문서가 한 번 읽는다
const BUY_KEY = 'shop.buyNow'
export const setBuyNow = (lines) => sessionStorage.setItem(BUY_KEY, JSON.stringify(lines))
export const getBuyNow = () => {
  try {
    return JSON.parse(sessionStorage.getItem(BUY_KEY)) || null
  } catch {
    return null
  }
}

export function useCart() {
  const [items, setItems] = useState(read)
  useEffect(() => {
    listeners.add(setItems)
    const onStorage = (e) => e.key === KEY && setItems(read())
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(setItems)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return items
}
