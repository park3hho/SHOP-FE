import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175, // SHOP-BE 의 돌아올 주소 허용 목록(ALLOWED_ORIGINS)과 같은 포트
    proxy: {
      // 배포에서는 vercel.json rewrite 가 같은 일을 한다 — /api/shop/… → https://api.eidofood.com/shop/…
      '/api/shop': {
        target: 'https://api.eidofood.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shop/, '/shop'),
      },
    },
  },
})