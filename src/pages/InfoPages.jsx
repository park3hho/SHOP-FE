import { Page } from '../components/Layout'
import { ShippingGuide } from './ProductPages'

// 약관 · 개인정보처리방침 · 구매대행 안내 — **초안** (2026-10-29). 오픈 전 사람이 검토하고 고친다.
const DRAFT = <p className="draft">초안이에요 — 오픈 전에 검토 후 확정해요.</p>

export function TermsPage() {
  return (
    <Page narrow>
      <article className="doc">
        <h1>이용약관</h1>
        {DRAFT}
        <h2>제1조 (목적)</h2>
        <p>이 약관은 이도(이하 “회사”)가 운영하는 EIDOFOOD(eidofood.com)에서 제공하는 해외구매대행 서비스의 이용 조건과 절차를 정합니다.</p>
        <h2>제2조 (서비스)</h2>
        <p>회사는 회원이 고른 중국 현지 상품을 회원을 대신해 구매하고, 회원 이름으로 통관해 배송합니다. 회원은 받는 분 본인의 개인통관고유부호를 정확히 알려야 합니다.</p>
        <h2>제3조 (회원가입 · 탈퇴)</h2>
        <p>만 14세 이상이면 가입할 수 있습니다. 회원은 마이페이지에서 언제든 탈퇴할 수 있습니다.</p>
        <h2>제4조 (주문 · 결제)</h2>
        <p>주문은 결제가 완료되면 성립합니다. 결제는 카카오페이 · 네이버페이로 합니다.</p>
        <h2>제5조 (취소 · 환불)</h2>
        <p>상품 준비 전에는 마이페이지에서 바로 취소할 수 있고 결제 금액 전액을 돌려드립니다. 상품 준비가 시작된 뒤의 취소와 반품은 고객센터로 문의해 주세요. 식품 특성상 단순 변심 반품은 제한될 수 있습니다.</p>
        <h2>제6조 (배송)</h2>
        <p>해외 배송과 통관 때문에 결제 후 약 7~14일이 걸리며, 통관 상황에 따라 늦어질 수 있습니다.</p>
      </article>
    </Page>
  )
}

export function PrivacyPage() {
  return (
    <Page narrow>
      <article className="doc">
        <h1>개인정보처리방침</h1>
        {DRAFT}
        <h2>1. 모으는 정보</h2>
        <p>가입: 이메일, 비밀번호(암호화), 이름, 휴대폰(선택). 주문: 받는 분 이름 · 휴대폰 · 주소, 개인통관고유부호, 결제 기록(결제사가 준 결제번호 · 수단).</p>
        <h2>2. 쓰는 곳</h2>
        <p>회원 관리, 주문 처리, 해외 구매 · 통관 · 배송, 고객 문의 응대. 광고 수신에 동의한 경우에만 할인 · 이벤트 소식을 보냅니다.</p>
        <h2>3. 맡기는 곳 (위탁 · 제공)</h2>
        <p>결제: 카카오페이, 네이버파이낸셜. 통관 · 배송: 배송대행업체, 관세청(통관부호 확인), 국내 택배사. 중국 판매처에는 받는 분 정보가 배송을 위해 전달될 수 있습니다.</p>
        <h2>4. 보관 기간</h2>
        <p>탈퇴 시 회원정보와 배송지를 지웁니다. 주문 · 결제 기록은 전자상거래법에 따라 5년 보관합니다.</p>
        <h2>5. 안전 조치</h2>
        <p>비밀번호는 복원할 수 없게 암호화하고, 연락처 · 주소 · 개인통관고유부호는 암호화해 저장합니다.</p>
        <h2>6. 문의</h2>
        <p>개인정보 보호책임자: 박찬호 (연락처 준비 중)</p>
      </article>
    </Page>
  )
}

export function GuidePage() {
  return (
    <Page narrow>
      <article className="doc">
        <h1>해외구매대행 안내</h1>
        <ShippingGuide />
      </article>
    </Page>
  )
}

// Story /story — MKT 팀이 쓴 글(브랜드 이야기 · 맛 소개)이 올라갈 자리. 지금은 준비 중
export function StoryPage() {
  return (
    <Page narrow>
      <div className="empty-box">
        <h1 className="page-title">Story</h1>
        <p>중국 음료에 얽힌 이야기를 준비하고 있어요.</p>
        <a className="btn-line inline" href="/products">
          상품 먼저 보기
        </a>
      </div>
    </Page>
  )
}