# SHOP-FE

이도식품 자사몰 프론트엔드 (eidofood.com). Vite + React, Vercel 배포.

- 개발: `npm install` → `npm run dev`
- 빌드: `npm run build`
- API: `/api/shop/*` → `https://api.eidofood.com/shop/*` (`vercel.json` rewrite · 개발은 vite proxy, 포트 5175)
- 결제(카카오페이 · 네이버페이): `src/lib/payments.js` + 설명서 `docs/payments.md`

## 디자인 규칙

디자인 시스템(컨셉 · 토큰 · 부품 · 사진 규칙 · 연출/AI 이미지 법 체크)은 AGC 의 플레이북에 있다.

- 문서: AGC-FE `src/playbooks/shop-design-system.md`
- 화면: AGC › 설정 › 플레이북 (개발자 모드에서만 메뉴가 보임)

