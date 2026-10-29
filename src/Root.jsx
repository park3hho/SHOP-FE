import App from './App.jsx'
import { Footer, Header } from './components/Layout'
import { match, useLocation } from './lib/router'
import { LoginPage, SignupPage } from './pages/AuthPages'
import { GuidePage, PrivacyPage, TermsPage } from './pages/InfoPages'
import {
  MyAddressesPage,
  MyHomePage,
  MyOrderPage,
  MyOrdersPage,
  MyPasswordPage,
  MyProfilePage,
} from './pages/MyPages'
import { CartPage, CheckoutPage, OrderCompletePage } from './pages/OrderPages'
import { ProductDetailPage, ProductListPage } from './pages/ProductPages'
import PayPages from './pay/PayPages.jsx'
import './shop.css'

// 경로 → 화면. 목록은 docs/shop-pages.md
export default function Root() {
  const { path, query } = useLocation()
  let m
  if (path === '/') return <App Header={Header} Footer={Footer} />
  if (path.startsWith('/pay')) return <PayPages />
  if (path === '/products') return <ProductListPage query={query} />
  if ((m = match('/products/:code', path))) return <ProductDetailPage key={m.code} code={m.code} />
  if (path === '/cart') return <CartPage />
  if (path === '/order/checkout') return <CheckoutPage />
  if (path === '/order/complete') return <OrderCompletePage query={query} />
  if (path === '/login') return <LoginPage query={query} />
  if (path === '/signup') return <SignupPage query={query} />
  if (path === '/my') return <MyHomePage />
  if (path === '/my/orders') return <MyOrdersPage />
  if ((m = match('/my/orders/:code', path))) return <MyOrderPage key={m.code} code={m.code} />
  if (path === '/my/addresses') return <MyAddressesPage />
  if (path === '/my/profile') return <MyProfilePage />
  if (path === '/my/password') return <MyPasswordPage />
  if (path === '/terms') return <TermsPage />
  if (path === '/privacy') return <PrivacyPage />
  if (path === '/guide') return <GuidePage />
  return (
    <>
      <Header />
      <main className="page narrow">
        <h1 className="page-title">페이지를 찾을 수 없어요</h1>
        <a href="/">홈으로</a>
      </main>
      <Footer />
    </>
  )
}
