import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PayPages from './pay/PayPages.jsx'
import './styles.css'

// /pay/… 는 결제 화면 (docs/payments.md), 나머지는 홈
const isPay = window.location.pathname.startsWith('/pay')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPay ? <PayPages /> : <App />}
  </React.StrictMode>,
)