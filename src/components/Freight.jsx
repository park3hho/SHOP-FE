// 해외 배송비 (예상) 줄 · 운임부담점수 — 플로팅 장바구니 미리보기 · 장바구니 · 주문서 공용
// 2026-11-27 사용자: 운임 계산 방식 · 무게 · 크기는 공개하지 않음. 무게 대신 '운임부담점수'(상품마다 정해진 점수의 합)만 보인다.
import { won } from '../lib/api'

// 운임부담점수 안내 문구 (2026-11-27 사용자 지정 문구)
export const SCORE_NOTE = '운임부담점수는 무게, 크기, 상품 인기도, 한정 판매 등 여러 요소를 고려하여 정해져요.'

export function FreightLabel({ f }) {
  return (
    <span className="fr-q" tabIndex={0}>
      해외 배송비 (예상)
      {f.data && (
        <span className="fr-tip">
          운임부담점수 {f.data.score.toLocaleString(undefined, { maximumFractionDigits: 1 })}점 기준
          <br />
          {SCORE_NOTE}
        </span>
      )}
    </span>
  )
}

export function FreightRow({ f }) {
  return (
    <>
      <FreightLabel f={f} />
      <span>{f.data ? won(f.data.fee) : f.loading ? '계산 중' : '-'}</span>
    </>
  )
}

export function FreightBar({ data }) {
  if (!data) return null
  return (
    <div className="fr-ship">
      운임부담점수 <b>{data.score.toLocaleString(undefined, { maximumFractionDigits: 1 })}점</b>
      <div className="fr-note">{SCORE_NOTE}</div>
      <div className="fr-avg">
        평균 배송비 <b>{won(data.avg)}</b> <span>(상품 1개당)</span>
      </div>
    </div>
  )
}
