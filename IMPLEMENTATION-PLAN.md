# Implementation Plan: PromptHub — AI Prompt Marketplace

## Objective
สร้าง marketplace สำหรับซื้อขาย AI Prompt โดยเฉพาะ ครีเอเตอร์อัปโหลดผลงานพร้อมพารามิเตอร์ ผู้ซื้อค้นหา ชำระเงิน และปลดล็อกคำสั่งจริง ระบบจัดการกระเป๋าเงินและค่าธรรมเนียมอัตโนมัติ

## Success Criteria
- ครีเอเตอร์ลงขาย prompt พร้อมตัวอย่างผลลัพท์และพารามิเตอร์ของ AI แต่ละค่ายได้
- ผู้ซื้อค้นหา/กรองตามโมเดล AI ยอดนิยม (Midjourney, ChatGPT, Sora) แบบ real-time
- ระบบตรวจสอบการชำระเงิน → ปลดล็อกเนื้อหาจริงให้ผู้ซื้อโดยอัตโนมัติ
- คำนวณค่าธรรมเนียมเว็บ 20-30% และเก็บส่วนที่เหลือเข้า Wallet ครีเอเตอร์
- ครีเอเตอร์กดถอนเงินจาก Wallet ได้

## สถาปัตยกรรมโดยรวม

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vue 3)                   │
│  Pages: Browse, PromptDetail, Dashboard, Wallet...  │
└──────────────┬──────────────────────────┬───────────┘
               │ HTTP/JSON                │ WebSocket?
               ▼                          ▼
┌─────────────────────────────────────────────────────┐
│              Gateway / API (Golang)                  │
│  Auth JWT | Prompt CRUD | Search | Payment | Wallet │
└──────────────┬──────────────────────────┬───────────┘
               │                          │
               ▼                          ▼
┌────────────────────┐    ┌───────────────────────────┐
│  PostgreSQL / D1    │    │   Redis / KV (Cache)      │
│  Users, Prompts,    │    │   Sessions, Rate Limit    │
│  Orders, Wallet     │    └───────────────────────────┘
└────────────────────┘
```

> **หมายเหตุ:** ปัจจุบัน backend เป็น Hono/Node.js (Cloudflare Workers) ตาม template การพัฒนา Golang backend จะทำใน Phase หลังหรือทำควบคู่กันไป

## Entity Relationship (Core)

```
User ──▶ Prompt (creator)
 │         │
 │         ├── Media[] (preview images/videos)
 │         ├── Parameters (JSON — ต่างกันตาม AI model)
 │         └── PromptContent (locked — ข้อความคำสั่งจริง)
 │
 ├── Order ──▶ Prompt
 │    └── Transaction
 │
 └── Wallet
      └── Transaction[] (fee deduction, withdrawal)
```

## Phase Plan

### Phase 0: Foundation ✅ *(เสร็จแล้ว)*
- โคลน template, เปลี่ยนชื่อ, git init, push GitHub
- Deploy Hono backend + Vue 3 frontend ขึ้น Cloudflare
- GitHub Actions CI/CD พร้อม

### Phase 1: Authentication & User Roles
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Solution Designer → Backend → Frontend |
| **Deliverable** | ระบบ login/register, Role (admin/creator/buyer) |
| **Dependencies** | Phase 0 |
| **Risk** | Low |

**สิ่งที่ต้องทำ:**
- ปรับ User entity เพิ่ม role, display_name, avatar, bio
- JWT authentication middleware
- Register/Login pages (Vue)
- Creator profile page
- Role-based route guards

### Phase 2: Creator Marketplace — Prompt CRUD
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Backend + Frontend |
| **Deliverable** | ครีเอเตอร์สร้าง/แก้ไข/ลบ Prompt พร้อมอัปโหลด media |
| **Dependencies** | Phase 1 |
| **Risk** | Medium |

**สิ่งที่ต้องทำ:**
- **Backend:**
  - Prompt entity: title, description, price, model_type, parameters (JSON), content (locked), preview_media[]
  - Parameter templates per model: Midjourney (prompt, ar, stylize...), ChatGPT (system, temperature...), Sora (prompt, duration...)
  - CRUD API: POST/GET/PATCH/DELETE `/api/v1/prompts`
  - Media upload (R2/Cloudflare Images หรือ S3-compatible)
- **Frontend:**
  - Create prompt form (dynamic parameters ตาม model)
  - Media upload with preview
  - My Prompts dashboard
  - Public prompt listing page

### Phase 3: Smart Search & Discovery
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Backend + Frontend |
| **Deliverable** | ค้นหา/กรอง prompt แบบ real-time |
| **Dependencies** | Phase 2 |
| **Risk** | Medium |

**สิ่งที่ต้องทำ:**
- **Backend:**
  - Full-text search (D1 FTS5 หรือ PostgreSQL tsvector)
  - Filters: model_type, price range, sort (newest/popular/price)
  - Pagination + cursor-based for performance
  - Cache layer (KV) สำหรับ热门 searches
- **Frontend:**
  - Search bar with autocomplete
  - Filter sidebar/panel (model badges: Midjourney, ChatGPT, Sora, etc.)
  - Real-time results as user types (debounced)
  - Prompt card component

### Phase 4: Payment & Unlock System
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Backend + Frontend |
| **Deliverable** | จ่ายเงิน → ตรวจสอบ → ปลดล็อก prompt content |
| **Dependencies** | Phase 2 |
| **Risk** | High |

**สิ่งที่ต้องทำ:**
- **Backend:**
  - Order entity: buyer_id, prompt_id, amount, status, payment_provider, paid_at
  - Payment gateway integration (Stripe/PromptPay/TrueMoney Wallet)
  - Webhook handler สำหรับรับ payment confirmation
  - Unlock logic: เมื่อ payment verified → สร้าง access grant → buyer เห็น content จริง
  - Encrypted content storage (content ถูกเข้ารหัส ปลดล็อกเมื่อจ่ายเงิน)
- **Frontend:**
  - Buy/Unlock button on prompt detail
  - Checkout page (เลือก payment method)
  - Unlocked content viewer (copy prompt, download media)
  - Order history

### Phase 5: Wallet & Fee Deduction
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Backend + Frontend |
| **Deliverable** | กระเป๋าเงิน + หักค่าธรรมเนียม + ถอน |
| **Dependencies** | Phase 4 |
| **Risk** | High |

**สิ่งที่ต้องทำ:**
- **Backend:**
  - Wallet entity: user_id, balance (locked + available)
  - เมื่อ Order completed → คำนวณ fee (configurable 20-30%) → ส่วนที่เหลือเข้า creator wallet
  - Transaction log (ทุกการเข้า-ออก)
  - Withdrawal API: request → admin approve → โอนออก (manual หรือ auto)
  - Fee config (admin adjustable percentage)
- **Frontend:**
  - Creator wallet dashboard (balance, transactions, pending withdrawals)
  - Withdrawal form
  - Admin fee settings page

### Phase 6: Admin Panel & Polish
| รายการ | รายละเอียด |
|---|---|
| **Owner** | Full-stack |
| **Deliverable** | Admin dashboard, reviews, analytics |
| **Dependencies** | Phase 3-5 |
| **Risk** | Low |

**สิ่งที่ต้องทำ:**
- Admin dashboard (users, prompts, orders, revenue)
- Prompt reviews/ratings system
- Report/flag inappropriate content
- Analytics: top creators, top models, revenue chart
- SEO, PWA, performance optimization

---

## Current Deployment Info

| Component | URL |
|---|---|
| Backend API | `https://prompthub-backend.pinto-thai.workers.dev` |
| API Docs | `https://prompthub-backend.pinto-thai.workers.dev/docs` |
| Frontend | `https://prompthub-55o.pages.dev` |
| GitHub | `https://github.com/watchakorn-18k/PromptHub` |
| Local Path | `/home/node/.openclaw/shared/PromptHub` |

### Cloudflare Resources
| Resource | Name | ID |
|---|---|---|
| D1 Database | `prompthub-db` | `c75fa743-2dfc-4e94-8fc4-0675f74bb781` |
| KV Namespace | `CACHE` | `28d97dbe16854d229d3f0a69757d611e` |
| Workers | `prompthub-backend` | — |
| Pages | `prompthub` | — |

---

## Key Technical Decisions (TBD)

| Decision | Options | Notes |
|---|---|---|
| **Backend Language** | Hono/Node.js (current) → **Golang** | User ต้องการ Golang สำหรับ API |
| **Database** | D1 (SQLite, current) → PostgreSQL | D1 ใช้ได้แต่ PostgreSQL จะยืดหยุ่นกว่าสำหรับ wallet transactions |
| **File Storage** | Cloudflare R2 / S3 / Images | สำหรับ media upload |
| **Payment Gateway** | Stripe / PromptPay / TrueMoney | ต้องรองรับคนไทย |
| **Search** | D1 FTS5 / Meilisearch / Typesense | Meilisearch เหมาะกับ real-time search |
| **Cache** | Cloudflare KV (current) / Redis | KV พอสำหรับ cache พื้นฐาน |

---

## Verification Strategy
- **Unit:** Go test (backend), Vitest (frontend)
- **Integration:** API integration tests สำหรับทุก endpoint
- **E2E:** Playwright test สำหรับ flow: สมัคร → login → สร้าง prompt → ค้นหา → ซื้อ → ดู content → เช็ค wallet
- **Manual:** Deploy preview → smoke test ทุก PR

## Risks and Mitigations
| Risk | Mitigation |
|---|---|
| Payment integration ซับซ้อน | เริ่มด้วย mock payment ก่อน แล้วค่อยเชื่อม gateway จริง |
| D1 limitations (5M rows read/day) | แผน migration ไป PostgreSQL เมื่อ traffic เพิ่ม |
| Media storage cost | ใช้ Cloudflare R2 (egress ฟรี) + บีบอัด/resize อัตโนมัติ |
| Wallet transactions ต้องการ atomicity | ใช้ database transactions + ledger pattern |
