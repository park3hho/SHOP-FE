// 상품 상세 원본 HTML — /products/:code 를 Vercel 이 이 함수로 보낸다 (vercel.json, 2026-11-18 검색 노출).
//
// 왜: 자사몰은 화면을 브라우저에서 그리는 방식이라, 원본(index.html)에는 상품 이름 · 가격 · 설명이 없다.
//     네이버 로봇은 거의 못 읽고 구글도 늦게 읽는다 → 상품 페이지 421개가 전부 첫 화면과 같아 보였다.
// 무엇: index.html 에 그 상품의 제목 · 검색 설명 · 공유 미리보기(og) · 대표 주소(canonical) · 구조화 데이터(JSON-LD Product)를 넣고,
//       #root 안에 상품 소개 글(상세페이지 문구) · 옵션 · 가격 · 제품 정보를 글자로 미리 넣어 보낸다.
//       손님 브라우저에서는 React 가 #root 를 그대로 덮어 그리므로 화면은 똑같다 (로봇에게만 다른 걸 주지 않는다).
// 실패하면(서버가 꺼짐 등) 기본 index.html 을 그대로 준다 → 손님 화면은 늘 뜬다.

const SITE = 'https://www.eidofood.com'
const API = 'https://api.eidofood.com/shop'

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`

async function getJson(url, ms) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'eidofood-ssr' } })
    if (!r.ok) return { status: r.status }
    return { status: r.status, body: await r.json() }
  } finally {
    clearTimeout(t)
  }
}

function headFor(p, url) {
  const title = `${p.name} | EIDOFOOD 이도식품`
  const desc = p.summary || `${p.name} — 무료배송 해외구매대행, EIDOFOOD 이도식품.`
  const img = p.photos?.[0] || `${SITE}/icon-512.png`
  const prices = (p.options || []).map((o) => o.price).filter(Boolean)
  const low = prices.length ? Math.min(...prices) : null
  const high = prices.length ? Math.max(...prices) : null
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      alternateName: p.name_cn,
      sku: p.code,
      image: (p.photos || []).slice(0, 6),
      description: desc,
      brand: p.brand ? { '@type': 'Brand', name: p.brand.replace(/\(.*\)$/, '').trim() || p.brand } : undefined,
      category: [p.category?.label, p.category?.sub_label].filter(Boolean).join(' > ') || undefined,
      countryOfOrigin: 'CN',
      offers: low
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'KRW',
            lowPrice: low,
            highPrice: high,
            offerCount: prices.length,
            availability: 'https://schema.org/InStock',
            url,
            seller: { '@type': 'Organization', name: 'EIDOFOOD 이도식품' },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'KRW' },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'KR' },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
                transitTime: { '@type': 'QuantitativeValue', minValue: 6, maxValue: 11, unitCode: 'DAY' },
              },
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'KR',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 7,
              returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
              returnMethod: 'https://schema.org/ReturnByMail',
            },
          }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'EIDOFOOD', item: `${SITE}/` },
        p.category?.code && {
          '@type': 'ListItem',
          position: 2,
          name: p.category.label,
          item: `${SITE}/products?cat=${p.category.code}`,
        },
        p.category?.sub && {
          '@type': 'ListItem',
          position: 3,
          name: p.category.sub_label,
          item: `${SITE}/products?cat=${p.category.code}&sub=${p.category.sub}`,
        },
        { '@type': 'ListItem', position: 4, name: p.name, item: url },
      ]
        .filter(Boolean)
        .map((x, i) => ({ ...x, position: i + 1 })),
    },
  ]
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    low ? `<meta property="product:price:amount" content="${low}" /><meta property="product:price:currency" content="KRW" />` : '',
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

function bodyFor(p) {
  const i = p.intro || {}
  const li = (arr, f) => (arr?.length ? `<ul>${arr.map(f).join('')}</ul>` : '')
  return `<article class="ssr-product">
  <nav><a href="/">EIDOFOOD</a> › <a href="/products?cat=${esc(p.category?.code || '')}">${esc(p.category?.label || '상품')}</a>${
    p.category?.sub ? ` › <a href="/products?cat=${esc(p.category.code)}&sub=${esc(p.category.sub)}">${esc(p.category.sub_label)}</a>` : ''
  }</nav>
  <h1>${esc(p.name)}</h1>
  <p lang="zh">${esc(p.name_cn)}</p>
  ${p.photos?.[0] ? `<img src="${esc(p.photos[0])}" alt="${esc(p.name)}" width="600" height="600" />` : ''}
  ${i.eyebrow ? `<p>${esc(i.eyebrow)}</p>` : ''}
  ${i.headline ? `<h2>${esc(i.headline)}</h2>` : ''}
  ${i.lead ? `<p>${esc(i.lead)}</p>` : ''}
  ${li(i.points, (x) => `<li><strong>${esc(x.title)}</strong> ${esc(x.desc)}</li>`)}
  ${i.flavors?.length ? `<h2>맛 고르기</h2>${i.flavors_lead ? `<p>${esc(i.flavors_lead)}</p>` : ''}${li(i.flavors, (x) => `<li><strong>${esc(x.name)}</strong>${x.name_cn ? ` (${esc(x.name_cn)})` : ''} — ${esc(x.desc)}</li>`)}` : ''}
  <h2>옵션 · 가격</h2>
  ${li(p.options, (o) => `<li>${esc(o.name)} — ${won(o.price)}</li>`)}
  <p>무료배송 · 해외구매대행 (결제 후 약 7~14일) · 개인통관고유부호 필요</p>
  ${i.howto?.length ? `<h2>이렇게 드세요</h2>${li(i.howto, (x) => `<li><strong>${esc(x.title)}</strong> ${esc(x.desc)}</li>`)}` : ''}
  ${p.info?.length ? `<h2>제품 정보</h2><dl>${p.info.map((r) => `<dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd>`).join('')}<dt>원산지</dt><dd>중국</dd></dl>` : ''}
</article>`
}

export default async function handler(req, res) {
  const code = String(req.query.code || '').slice(0, 30)
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.eidofood.com'
  let html = ''
  try {
    const r = await fetch(`https://${host}/index.html`, { headers: { 'user-agent': 'eidofood-ssr' } })
    html = await r.text()
  } catch {
    res.setHeader('Location', '/')
    return res.status(302).end()
  }
  try {
    if (!/^[A-Za-z0-9-]+$/.test(code)) throw new Error('bad code')
    const { status, body } = await getJson(`${API}/products/${encodeURIComponent(code)}`, 3500)
    if (status === 404) res.status(404) // 없는 · 안 파는 상품 — 화면은 그대로 '없어요' 안내
    const p = body?.product
    if (p) {
      const url = `${SITE}/products/${p.code}`
      html = html
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/<meta name="description"[^>]*>/, '')
        .replace(/<link rel="canonical"[^>]*>/, '')
        .replace(/<meta property="og:(type|title|description|url|image)"[^>]*>\s*/g, '')
        .replace('</head>', `    ${headFor(p, url)}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${bodyFor(p)}</div>`)
    }
  } catch {
    // 상품을 못 읽어도 기본 화면은 준다
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Vercel 앞단 캐시 10분, 서버가 늦거나 꺼져도 하루는 지난 판으로
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  return res.send(html)
}
