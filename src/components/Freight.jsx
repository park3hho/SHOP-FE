// 해외 배송비 (예상) 줄 · 계산 무게 막대 — 플로팅 장바구니 미리보기 · 장바구니 화면 공용 (2026-11-27 목업 승인)
import { won } from '../lib/api'
import { kgText } from '../lib/freight'

export function FreightLabel({ f }) {
  return (
    <span className="fr-q" tabIndex={0}>
      해외 배송비 (예상)
      {f.data && <span className="fr-tip">예상 무게 {kgText(f.data.weight_g)} 기준</span>}
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

// 30kg 칸이 상자 수만큼 가로로 붙고, 무게는 0kg 부터 이어서 채운다
export function FreightBar({ data }) {
  if (!data) return null
  const kg = data.boxes.reduce((s, b) => s + b.billable_kg, 0)
  const n = Math.max(1, data.boxes.length)
  return (
    <div className="fr-ship">
      계산 무게 <b>{kg.toFixed(1)}kg</b>
      <div className="fr-track">
        {Array.from({ length: n }, (_, b) => (
          <div className="fr-seg" key={b}>
            <i style={{ width: `${(Math.max(0, Math.min(30, kg - b * 30)) / 30) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="fr-lbl">
        {Array.from({ length: n }, (_, b) => (
          <span key={b}>
            {n > 1 ? `상자 ${b + 1} · ` : ''}
            {b * 30}–{(b + 1) * 30}kg
          </span>
        ))}
      </div>
      <div className="fr-avg">
        평균 배송비 <b>{won(data.avg)}</b> <span>(상품 1개당)</span>
      </div>
    </div>
  )
}
