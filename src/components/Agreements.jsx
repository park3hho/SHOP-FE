import { useState } from 'react'

// 약관 동의 — 전체 동의 + 항목마다 체크 · '내용 보기'로 그 자리에서 본문을 펼친다 (회원가입 · 소셜 가입 · 주문서 공용, 2026-10-30)
//   items: [{ key, required, label, body? }] · value: { [key]: bool } · onChange(nextValue)
export function Agreements({ items, value, onChange, allLabel = '전체 동의' }) {
  const [open, setOpen] = useState(null)
  const all = items.every((i) => value[i.key])
  return (
    <div className="agree-box">
      <label className="check all">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => onChange(Object.fromEntries(items.map((i) => [i.key, e.target.checked])))}
        />
        <b>{allLabel}</b>
      </label>
      {items.map((i) => (
        <div className="agree-item" key={i.key}>
          <div className="agree-row">
            <label className="check">
              <input type="checkbox" checked={!!value[i.key]} onChange={(e) => onChange({ ...value, [i.key]: e.target.checked })} />
              <span>
                <span className={i.required ? 'agree-req' : 'agree-opt'}>{i.required ? '[필수]' : '[선택]'}</span> {i.label}
              </span>
            </label>
            {i.body && (
              <button type="button" className="agree-toggle" aria-expanded={open === i.key} onClick={() => setOpen(open === i.key ? null : i.key)}>
                {open === i.key ? '접기' : '내용 보기'}
              </button>
            )}
          </div>
          {open === i.key && <div className="agree-body">{i.body}</div>}
        </div>
      ))}
    </div>
  )
}

export const requiredOk = (items, value) => items.filter((i) => i.required).every((i) => value[i.key])
export const emptyAgree = (items) => Object.fromEntries(items.map((i) => [i.key, false]))