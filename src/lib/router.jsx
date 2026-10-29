// 아주 작은 라우터 — 패키지 없이 history API 로 (vercel.json 이 모든 경로를 index.html 로 보낸다)
import { useEffect, useState } from 'react'

const EVT = 'shop:navigate'

export const navigate = (to, { replace = false } = {}) => {
  if (replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(EVT))
  window.scrollTo(0, 0)
}

// 지금 주소 { path, query } — 이동하면 다시 그린다
export function useLocation() {
  const read = () => ({
    path: window.location.pathname.replace(/\/+$/, '') || '/',
    query: new URLSearchParams(window.location.search),
  })
  const [loc, setLoc] = useState(read)
  useEffect(() => {
    const on = () => setLoc(read())
    window.addEventListener('popstate', on)
    window.addEventListener(EVT, on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener(EVT, on)
    }
  }, [])
  return loc
}

// <Link to="/cart">장바구니</Link> — 새 탭(ctrl·cmd 클릭)은 그대로 둔다
export function Link({ to, children, className, onClick, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

// '/products/:code' 같은 패턴 맞추기 → { code } 또는 null
export const match = (pattern, path) => {
  const p = pattern.split('/')
  const a = path.split('/')
  if (p.length !== a.length) return null
  const params = {}
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i])
    else if (p[i] !== a[i]) return null
  }
  return params
}
