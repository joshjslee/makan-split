# Makan Split - Project Context & Knowledge Base

> **목적**: 이 문서는 Claude에게 프로젝트 컨텍스트를 전달하기 위한 종합 문서입니다.
> **최종 업데이트**: 2026-01-29

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

**Makan Split**은 레스토랑/식당 영수증을 기반으로 친구들과 비용을 분할하는 웹 애플리케이션입니다. "Makan"은 말레이어로 "먹다"를 의미하며, 이 앱은 말레이시아 시장을 타겟으로 합니다.

### 1.2 핵심 기능

| 기능 | 설명 |
|------|------|
| **영수증 스캔 (OCR)** | 카메라로 영수증을 촬영하면 AI가 항목을 자동 추출 |
| **그룹 멤버 설정** | 2-10명의 멤버 추가 (이름, 전화번호, 아바타) |
| **항목 할당** | 각 항목을 누가 먹었는지 할당 |
| **세금/서비스료 계산** | Service Charge, SST 자동 계산 |
| **WhatsApp 공유** | 개인별 결제 요청 메시지를 WhatsApp으로 전송 |
| **결제 추적** | Paid/Pending 상태 관리 및 리마인더 전송 |

### 1.3 타겟 시장

- **국가**: 말레이시아
- **통화**: Malaysian Ringgit (RM)
- **결제 시스템**: DuitNow (말레이시아 즉시 송금 시스템)
- **메시징**: WhatsApp (말레이시아 주요 메신저)
- **전화번호 형식**: +60 (Malaysia country code)

---

## 2. 기술 스택

### 2.1 Frontend

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Routing | React Router DOM | 7.12.0 |
| Styling | TailwindCSS | 4.1.18 |
| State | React Context API | - |
| Icons | Lucide React | 0.562.0 |
| Utilities | clsx, tailwind-merge | - |

### 2.2 Backend & External Services

| 서비스 | 용도 | 설명 |
|--------|------|------|
| **Supabase** | Database | PostgreSQL 기반 BaaS |
| **Google Gemini** | OCR | 영수증 이미지에서 항목 추출 (gemini-1.5-flash) |
| **Vercel** | Deployment | SPA 호스팅 |

### 2.3 환경변수

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. 프로젝트 구조

```
src/
├── App.jsx                    # 라우팅 설정
├── main.jsx                   # 엔트리 포인트
├── index.css                  # 글로벌 스타일 (TailwindCSS)
│
├── pages/                     # 페이지 컴포넌트
│   ├── HomePage.jsx           # 홈 (새 분할 시작 또는 기존 기록)
│   ├── SetupPage.jsx          # 멤버 추가 (2-10명)
│   ├── ScanPage.jsx           # 영수증 스캔 (카메라/갤러리)
│   ├── AssignPage.jsx         # 항목 → 멤버 할당
│   ├── SummaryPage.jsx        # 멤버별 금액 요약
│   ├── SharePage.jsx          # WhatsApp/DuitNow 공유
│   └── TrackingPage.jsx       # 결제 상태 추적
│
├── components/ui/             # 재사용 UI 컴포넌트
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Layout.jsx             # 공통 레이아웃 (Header, Main, BottomBar)
│   ├── Modal.jsx
│   └── index.js               # 컴포넌트 export
│
├── context/
│   └── SplitContext.jsx       # 전역 상태 관리
│
├── services/
│   └── gemini.js              # Gemini OCR 서비스
│
└── lib/
    ├── supabase.js            # Supabase 클라이언트
    └── utils.js               # 유틸리티 함수
```

---

## 4. 데이터베이스 스키마 (Supabase)

### 4.1 테이블 구조

#### `splits` - 분할 세션
```sql
id              UUID PRIMARY KEY
title           TEXT                    -- 영수증 제목 (예: "New Receipt")
currency        TEXT DEFAULT 'KRW'      -- 통화 (RM 사용 예정)
tax_amount      NUMERIC                 -- 세금 비율 (%)
service_charge  NUMERIC                 -- 서비스 차지 비율 (%)
created_at      TIMESTAMP
```

#### `participants` - 멤버
```sql
id              UUID PRIMARY KEY
split_id        UUID REFERENCES splits(id)
name            TEXT                    -- 멤버 이름
is_settled      BOOLEAN DEFAULT FALSE   -- 정산 완료 여부
created_at      TIMESTAMP
```

#### `items` - 영수증 항목
```sql
id              UUID PRIMARY KEY
split_id        UUID REFERENCES splits(id)
name            TEXT                    -- 항목 이름
price           NUMERIC                 -- 가격
quantity        INTEGER DEFAULT 1       -- 수량
created_at      TIMESTAMP
```

#### `item_assignments` - 항목-멤버 매핑
```sql
id              UUID PRIMARY KEY
item_id         UUID REFERENCES items(id)
participant_id  UUID REFERENCES participants(id)
```

### 4.2 로컬 저장소 (localStorage)

DB에 저장되지 않는 데이터:
- `current_split_id` - 현재 작업 중인 분할 ID
- `payment_status` - 멤버별 결제 상태 (`{ memberId: 'paid' | 'pending' }`)
- `payment_settings` - DuitNow/은행 정보
- `reminder_settings` - 리마인더 설정 (빈도, 시간, 자동전송)

---

## 5. 사용자 흐름 (User Flow)

```
HomePage ─→ SetupPage ─→ ScanPage ─→ AssignPage ─→ SummaryPage ─→ SharePage ─→ TrackingPage
   │                         │
   │                         └── (스캔 실패 시) Direct Input 옵션
   │
   └── TrackingPage (이전 세션 추적)
```

### 5.1 상세 흐름

1. **HomePage**: 새 분할 시작 또는 이전 기록 확인
2. **SetupPage**: 멤버 추가 (이름, 전화번호, 아바타 이모지)
   - "It's Me" 지정으로 본인 식별
3. **ScanPage**: 영수증 촬영 → Gemini OCR로 항목 추출
   - 스캔 실패 시 "Direct Input" 버튼으로 수동 입력 전환
   - 기본 항목: Nasi Lemak (RM 15.00), Teh Tarik (RM 5.00)
4. **AssignPage**: 각 항목을 누가 먹었는지 할당
   - "Add All" 버튼으로 모든 멤버에게 일괄 할당
   - 세금/서비스 차지 설정
5. **SummaryPage**: 각 멤버별 총 금액 확인
6. **SharePage**: WhatsApp/DuitNow 링크 공유
   - 개인별 메시지 전송 또는 일괄 전송
7. **TrackingPage**: 결제 상태 추적 (Paid/Pending)
   - 리마인더 메시지 전송

---

## 6. 핵심 컴포넌트 상세

### 6.1 SplitContext (전역 상태)

#### State
```javascript
{
  currentSplitId,     // UUID - 현재 분할 세션 ID
  members,            // Array<{ id, name, avatar, phone, isSettled }>
  items,              // Array<{ id, name, price, quantity, assignedMembers: UUID[] }>
  taxSettings,        // { serviceCharge: number, serviceTax: number }
  paymentSettings,    // { duitNowId, bankName, accountNumber }
  paymentStatus,      // { [memberId]: 'paid' | 'pending' }
  reminderSettings,   // { frequency, time, autoSend }
  subtotalAmount,     // 소계
  totalAmount,        // 총액 (세금 포함)
  loading,            // boolean
}
```

#### Actions
```javascript
createNewSplit(title)           // 새 분할 세션 생성
addMember(name)                 // 멤버 추가
addMemberWithDetails(details)   // 상세 정보와 함께 멤버 추가
updateMember(memberId, updates) // 멤버 정보 수정
bulkAddItems(itemsList)         // 항목 일괄 추가 (OCR 결과)
removeItem(itemId)              // 항목 삭제
assignMemberToItem(itemId, memberId)  // 항목에 멤버 할당/해제 (토글)
assignAllToItem(itemId)         // 항목에 모든 멤버 할당
calculateMemberShare(memberId)  // 멤버별 금액 계산
setTaxSettings(settings)        // 세금 설정 변경
markAsPaid(memberId)            // 결제 완료 표시
markAsPending(memberId)         // 미결제 표시
resetSession()                  // 세션 초기화
```

### 6.2 Gemini OCR 서비스

**파일**: `src/services/gemini.js`

```javascript
parseReceiptImage(imageFile)
// Input: File (image/jpeg, image/png 등)
// Output: Array<{ name: string, price: number, quantity: number }>
```

**프롬프트**:
```
Extract items from this receipt image.
Return a JSON array of objects with exactly these keys: "name", "price", "quantity".
"price" must be a number (no currency symbols).
"quantity" must be an integer.
If quantity is not clearly visible, use 1.
Exclude tax, service charge, and total.
```

**에러 핸들링**:
- 400: 이미지가 너무 크거나 지원되지 않는 형식
- 404: Gemini 모델을 찾을 수 없음
- 429: 할당량 초과 (너무 빠른 요청)
- 401/403: API 키 인증 실패
- SAFETY: 안전 필터에 의해 차단됨

### 6.3 금액 계산 로직

```javascript
// 멤버별 금액 계산
const calculateMemberShare = (memberId) => {
  // 1. 소계: 멤버에게 할당된 항목 가격 합계
  //    (항목이 N명에게 할당되면 가격/N)
  const subtotal = items.reduce((total, item) => {
    if (item.assignedMembers.includes(memberId)) {
      return total + item.price / item.assignedMembers.length;
    }
    return total;
  }, 0);

  // 2. 서비스 차지 (소계의 X%)
  const serviceCharge = subtotal * (taxSettings.serviceCharge / 100);

  // 3. 서비스 세금 (소계 + 서비스 차지의 X%)
  const taxableAmount = subtotal + serviceCharge;
  const serviceTax = taxableAmount * (taxSettings.serviceTax / 100);

  // 4. 총액
  return {
    subtotal,
    serviceCharge,
    serviceTax,
    total: subtotal + serviceCharge + serviceTax
  };
};
```

---

## 7. 개발 히스토리

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-01-16 | 673353e | Initial commit - 기본 프로젝트 설정 |
| 2026-01-16 | 010a257 | Supabase 초기화 에러 핸들링 추가 |
| 2026-01-19 | c71b79e | Direct Input 기본 항목 및 스캔 실패 시 폴백 기능 추가 |
| 2026-01-19 | 6606c99 | 스캔 에러에서 자동 리다이렉트 제거, 수동 Direct Input 버튼 유지 |

---

## 8. 주요 구현 특징

### 8.1 Optimistic UI Updates
- 대부분의 작업이 UI를 먼저 업데이트하고, 백그라운드에서 DB 동기화
- 실패 시 롤백 처리

### 8.2 Mobile-First Design
- 전체 화면 카메라 인터페이스
- 터치 친화적 UI
- 모바일 최적화된 레이아웃

### 8.3 WhatsApp Integration
- 말레이시아 전화번호 형식 자동 변환 (+60)
- 사전 작성된 메시지와 함께 WhatsApp 열기
- `https://wa.me/{phone}?text={message}` 형식 사용

### 8.4 Error Handling
- Supabase 미설정 시 Mock 클라이언트 제공
- OCR 실패 시 Direct Input 폴백
- 네트워크 오류 시 사용자 친화적 메시지

---

## 9. 향후 고려사항

- [ ] 사용자 인증 (Supabase Auth)
- [ ] 다국어 지원 (i18n) - 영어, 말레이어, 중국어
- [ ] PWA 지원 (오프라인 모드)
- [ ] 정산 히스토리 대시보드
- [ ] 실제 DuitNow QR 코드 생성
- [ ] 그룹/친구 목록 저장 기능

---

## 10. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

---

## 11. 디자인 시스템

### 11.1 색상 변수 (CSS Custom Properties)

```css
--color-brand-green        /* 주요 브랜드 색상 (녹색) */
--color-brand-green-dark   /* 어두운 녹색 */
--color-brand-blue         /* 보조 색상 (파란색) */
--color-brand-blue-light   /* 밝은 파란색 배경 */
--color-status-paid        /* 결제 완료 상태 (녹색) */
--color-status-pending     /* 미결제 상태 (주황색) */
--color-surface-muted      /* 비활성 텍스트 색상 */
```

### 11.2 컴포넌트 패턴

- **Layout**: Header + Main + BottomBar 구조
- **Card**: 둥근 모서리, 그림자가 있는 컨테이너
- **Button**: primary, secondary, outline 변형
- **Modal**: 오버레이와 함께 중앙 정렬된 대화상자

---

## 12. API 응답 예시

### 12.1 Gemini OCR 응답
```json
[
  { "name": "Nasi Lemak Special", "price": 15.00, "quantity": 1 },
  { "name": "Teh Tarik", "price": 5.00, "quantity": 2 },
  { "name": "Roti Canai", "price": 3.50, "quantity": 1 }
]
```

### 12.2 WhatsApp 메시지 템플릿
```
Hey {이름}! 🍜

We just had lunch together and your share is RM {금액}.

Please DuitNow/Transfer to:
ID: {DuitNow ID}
Bank: {은행명}
Acc: {계좌번호}

Thank you! 🙏
```

---

## 13. 참고 링크

- [React 19 문서](https://react.dev/)
- [Supabase 문서](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [TailwindCSS 4.x](https://tailwindcss.com/docs)
- [DuitNow](https://www.paynet.my/duitnow.html)

---

**이 문서를 Claude에게 제공하면 Makan Split 프로젝트의 전체 컨텍스트를 이해하고 관련 작업을 수행할 수 있습니다.**
