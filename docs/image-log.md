# 이미지 생성 기록

> playbook shop-design-system §5.3 · §6.5 — 이미지마다 프롬프트 · 입력 원본 · 만든 날짜를 남긴다.
> 도구: Aside imagegen · 만든 날: 2026-10-27 · 저장 시 JPEG(품질 0.82)로 줄임

## A. 분위기 연출컷 (`public/img/*.jpg`)

공통 문장: `Editorial lifestyle product photography for a minimalist Korean select-shop website (like 29CM). Natural light, muted film tones, generous negative space, no text, no logos, no readable labels.`

| 파일 | 프롬프트(장면 부분) |
| --- | --- |
| soda.jpg | Vertical portrait composition. Several retro glass bottles of orange soda with condensation on a worn stainless-steel counter of a small Beijing hutong corner shop, warm late-afternoon sunlight and long shadows, grey brick wall behind. |
| tea.jpg | Landscape composition. Clear PET bottles of pale green jasmine tea lying on light oak wood beside a few fresh white jasmine flowers, soft morning daylight, calm and clean. |
| fridge.jpg | Landscape composition. Inside an open convenience-store glass fridge, neat rows of colorful juice and milk tea bottles and cans, cool white light, slight cold mist, shot straight on, shallow depth of field. |
| lychee.jpg | Vertical portrait composition. A hand holding a cold aluminium can of lychee sparkling drink against a pale pink plastered wall, bright summer daylight, playful but minimal. |
| milktea.jpg | Landscape composition. Three plastic bottles of creamy milk tea and one paper cup of Hong Kong style milk tea on a small round marble cafe table by a window, soft afternoon light, cozy and calm. |
| lychee-glass.jpg | Landscape composition. Two tall glasses of pale pink lychee sparkling soda with ice cubes and fresh peeled lychees on a light pink tabletop, bright summer daylight, crisp bubbles. (기획전 대표 사진 전용 — 원재료 확인 전이라 특정 상품 옆 단독 사용 금지, playbook §6.2) |

## B. 상품 연출컷 (`public/img/stage/{제품코드}.jpg`)

공통 프롬프트: `Product staging photo for a minimalist Korean select-shop website (like 29CM). Use the product from the reference image and keep its packaging EXACTLY as it is: same shape, proportions, colors, logo, and label text (do not redraw or invent any text). Remove all promotional text, badges, and background graphics from the reference. Square composition, natural light, muted film tones, generous negative space, photorealistic. No extra text, no other brands.`

| 제품 | 입력 원본(AGC 사진) | 장면 | 대조 결과 |
| --- | --- | --- | --- |
| PR-261020-0007 북빙양 귤맛 탄산음료 (캔) | /files/photos/2026/10/6ab36c7a49fc45f68ea7bbf2d7511614.jpg | One can standing on a worn stainless-steel counter of a small Beijing hutong corner shop, warm late-afternoon sunlight with long shadows, grey brick wall softly blurred behind. | 라벨 일치. 말풍선 속 작은 글자 일부 뭉개짐 |
| PR-261019-0001 농부산천 동방수엽 무가당 차음료 | /files/photos/2026/10/388deb1de30e47f182ca72cfe3bd8f0b.jpg | The bottles standing in a neat row on a light oak table, soft morning daylight from a window, clean white wall behind. | 병 6개 라벨 일치 |
| PR-261024-0012 훙바오라이 리치맛 탄산음료 (캔) | /files/photos/2026/10/971ec85b9f514eb09a371dc35888afc3.jpg | One can standing on a pale pink plaster ledge against a pale pink wall, bright summer daylight with soft leaf shadows. No fruit. | 라벨 일치. 과일 소품 없음(리치맛 — 원재료 확인 전) |
| PR-261019-0007 통일 아삼 밀크티 | /files/photos/2026/10/ecc96e62273a4f4eba57104f58af52f2.jpg | One bottle standing on a small round white marble cafe table by a window, soft afternoon light. | 병·상자 라벨 일치 |
| PR-261025-0009 탕천목장 100% 코코넛워터 | /files/photos/2026/10/5cc784508ab4495284c915f8a18ae095.jpg | The product placed on natural linen cloth beside half of a fresh young coconut, bright airy daylight. | 상자·병 라벨 일치. 코코넛 소품(100% 코코넛워터) |
| PR-261024-002C 산토리 청차 무가당 룽징 재스민차 | /files/photos/2026/10/9a819c432a6947749d0e036d2acc3147.jpg | One bottle standing on light oak wood with a small pinch of loose green tea leaves beside it, soft morning daylight, calm and clean. No flowers. | 라벨 일치. 찻잎 소품 |
| PR-261020-0003 왕왕 왕자이 우유 (캔 밀크) | /files/photos/2026/10/1dbd673fc7e944eaac93f07c8a3139bb.jpg | One can standing on a wooden kids desk next to a closed notebook and a pencil, warm morning light, cozy home mood. | 라벨 일치 |
| PR-261025-0029 싼치 통레몬 레몬 탄산음료 (캔) | /files/photos/2026/10/16bd73fe588f479cbdf13dd8e8c3f47d.jpg | One can standing in crushed ice in a brushed stainless steel tray, cool bright daylight, condensation on the can. | 라벨 대체로 일치. 위쪽 작은 글자 일부 뭉개짐 · 레몬은 캔 그림만 |
