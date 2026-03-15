# CILT 台灣分會網站 - 系統規格書

## 1. 專案概述

### 1.1 專案名稱
英國皇家物流與運輸學會（CILT）台灣分會官方網站

### 1.2 專案目標
建立具備完整會員管理、線上報名、付費機制的獨立網站，取代現有傳統 PHP 網站，採用現代化設計風格與技術架構。

### 1.3 技術架構

| 項目 | 技術選擇 |
|------|----------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript |
| 後端 | Node.js + Express.js |
| 資料庫 | SQLite（better-sqlite3） |
| 認證機制 | JWT（JSON Web Token）+ bcrypt |
| 金流 | 綠界科技 ECPay |
| 檔案處理 | multer |
| 郵件服務 | nodemailer（SMTP） |
| 設計系統 | 核心顧問風格（Navy #0a1628 + Teal #00d4aa） |

---

## 2. 使用者角色

### 2.1 訪客（Guest）
- 瀏覽所有公開頁面
- 查看最新消息、活動資訊、認證資訊
- 使用聯絡表單
- 註冊成為會員

### 2.2 一般會員（Member）
- 所有訪客功能
- 登入/登出
- 編輯個人資料
- 線上報名課程/考試
- 線上繳費
- 查看報名紀錄與繳費紀錄
- 追蹤 CILT 認證等級
- 下載會員專屬資源

### 2.3 管理員（Admin）
- 所有會員功能
- 會員管理（查看/編輯/停用/匯出）
- 內容管理（新增/編輯/刪除/上下架）
- 報名與付費管理
- 聯絡表單管理
- 系統設定

---

## 3. 頁面規格

### 3.1 共用元件

#### 3.1.1 頂部導航列（Header）
```
┌─────────────────────────────────────────────────────────┐
│ [CILT Logo] The Chartered Institute of    HOME | 聯絡我們 │
│             Logistics & Transport - Taiwan               │
├─────────────────────────────────────────────────────────┤
│ 關於協會 | 最新消息 | 活動資訊 | 認證專區 | 線上報名 |    │
│ 考試資訊 | 下載專區 | 經驗分享         [登入] [註冊]      │
└─────────────────────────────────────────────────────────┘
```
- 毛玻璃效果固定導航列
- 8 個主導航按鈕
- 右上角：登入/註冊 或 會員名稱/登出
- 手機版：漢堡選單

#### 3.1.2 左側欄（Sidebar）
- 依當前頁面動態顯示子選單
- 可摺疊式選單分類
- 會員登入快捷區塊
- 民國年日期顯示

#### 3.1.3 麵包屑導航（Breadcrumb）
- 格式：首頁 > 目前分類 > 目前頁面
- 每一層可點擊

#### 3.1.4 頁尾（Footer）
- 協會地址、電話、傳真
- CILT Logo
- 版權聲明
- 快速連結

---

### 3.2 首頁（index.html）

| 區塊 | 內容 |
|------|------|
| Hero | CILT Logo + 全球物流專業認證權威 + CTA 按鈕 |
| 簡介 | 1919 年成立、皇家憲章、全球 30,000+ 會員 |
| 四大宗旨 | 4 張卡片展示核心宗旨 |
| 認證等級 | Level 1-4 四級認證概覽 |
| 最新消息 | 動態載入最新 5 則消息 |
| 近期活動 | 動態載入最新 3 則活動 |
| CTA | 立即加入會員 / 了解認證 |

---

### 3.3 關於協會（about.html）

透過左側欄切換 4 個子頁面（SPA 式 tab 切換）：

#### 3.3.1 CILT 國際組織簡介
- 創立沿革（1919 年成立、1926 年皇家憲章）
- 全球分布（30+ 國家、30,000+ 會員）
- 皇家特許（Chartered Status）說明

#### 3.3.2 宗旨
- 追求物流與運輸職業精神
- 提升物流與運輸職業水準
- 加强物流與運輸專業人員國際交流與合作
- 推廣物流與運輸最佳實踐

#### 3.3.3 台灣分會簡介
- 分會設立歷史
- 組織架構
- 服務項目

#### 3.3.4 國際總會資格承認
- 資格承認說明
- 國際互認機制

---

### 3.4 最新消息（news.html）

#### 前台功能
- 消息列表：日期 + 分類標籤 + 標題
- 分類篩選：課程資訊 / 協會公告 / 活動
- 關鍵字搜尋
- 分頁：每頁 10 則
- 點擊進入消息詳情頁

#### API 規格
```
GET /api/news
  Query: page, limit, category, keyword
  Response: { data: [...], total, page, totalPages }

GET /api/news/:id
  Response: { id, title, category, content, image_url, created_at }
```

---

### 3.5 活動資訊（activities.html）

#### 前台功能
- 活動列表含縮圖
- 分類篩選：研討會 / 課程 / 參訪 / 論壇 / 展覽 / 講座
- 日期區間篩選
- 關鍵字搜尋
- 分頁：每頁 9 則（3x3 grid）

#### API 規格
```
GET /api/activities
  Query: page, limit, category, keyword, start_date, end_date
  Response: { data: [...], total, page, totalPages }

GET /api/activities/:id
  Response: { id, title, category, description, image_url, event_date, location }
```

---

### 3.6 認證專區（certification.html）

左側欄切換 5 個子頁面：

#### 3.6.1 CILT 機構簡介
- 1999 年合併成立說明
- 英國女皇伊麗莎白二世簽署皇家令狀
- 全球權威地位

#### 3.6.2 認證分級
四級認證卡片式呈現：

| 等級 | 中文名稱 | 英文名稱 | 報考資格 |
|------|----------|----------|----------|
| Level 1 | 物流初級人員證書 | Foundation Certificate | 高中畢+2年經驗 或 大學物流系二年級+ |
| Level 2 | 物流部門主管證書 | Certificate for Supervisory Managers | 大學畢+1年 或 專科畢+3年 或 Level 1 持有者 |
| Level 3 | 物流營運經理證書 | Diploma for Operational Managers | 博士 或 碩士+1年 或 學士+3年 或 Level 2 持有者 |
| Level 4 | 物流高階經理證書 | Advanced Diploma for Strategic Managers | 博士+1年 或 碩士+3年 或 學士+5年 或 Level 3 持有者 |

#### 3.6.3 認證系統比較
- 與其他物流認證比較表

#### 3.6.4 適合參加對象
- 各等級適合的職位與背景

#### 3.6.5 課程介紹
- 各等級課程大綱：物流原理、運輸管理、倉儲、採購、供應鏈規劃、全球物流、IT 系統、國際貿易

---

### 3.7 線上報名（register.html）

#### 前台功能
- 課程列表（卡片式）
- 篩選：報名類別（研討會/一般課程/認證課程）
- 開課時間區間選擇
- 關鍵字搜尋
- 報名流程：
  1. 選擇課程 → 2. 確認資料 → 3. 線上繳費 → 4. 報名完成
- 需登入才能報名

#### API 規格
```
GET /api/courses
  Query: page, limit, type, keyword, start_date, end_date
  Response: { data: [...], total, page, totalPages }

POST /api/registrations
  Auth: Bearer Token
  Body: { course_id }
  Response: { registration_id, payment_url }

GET /api/registrations/my
  Auth: Bearer Token
  Response: { data: [...] }
```

---

### 3.8 考試資訊（exam.html）

#### 內容
- 各級考試時間表：

| 等級 | 考試時間 | 考試日 |
|------|----------|--------|
| Level 1 | 6月、12月 | 週日 |
| Level 2 | 6月、12月 | 週日 |
| Level 3 | 6月、12月 | 週六日 |
| Level 4 | 不定期 | — |

- 各級考試科目明細
- 考試形式說明：
  - Level 1：選擇題
  - Level 2-3：簡答 + 論述
  - Level 4：英文報告（5,000+ 字 x2）+ 論文
- 考生守則（8 條規定）

#### API 規格
```
GET /api/exams
  Response: { data: [...] }
```

---

### 3.9 下載專區（downloads.html）

#### 前台功能
- 檔案列表：標題 + 分類 + 檔案大小 + 下載次數
- 9 大分類篩選：
  1. 協會各項表格
  2. 參考文獻
  3. 政府法令
  4. 研討會資料
  5. 各項公告附檔
  6. 活動簡章
  7. CILT 台灣分會
  8. 學員講師資料專區
  9. 其他
- 日期區間篩選
- 關鍵字搜尋
- 部分檔案限會員下載

#### API 規格
```
GET /api/downloads
  Query: page, limit, category, keyword
  Response: { data: [...], total, page, totalPages }

GET /api/downloads/:id/file
  Auth: Optional Bearer Token（會員專屬檔案需要）
  Response: File stream
```

---

### 3.10 經驗分享（columns.html）

#### 前台功能
- 專欄卡片列表：作者照片 + 姓名 + 職稱 + 公司 + CILT 等級 + 摘要
- 分類篩選：企業 / 學生
- 關鍵字搜尋
- 點擊展開全文

#### API 規格
```
GET /api/columns
  Query: page, limit, category, keyword
  Response: { data: [...], total, page, totalPages }

GET /api/columns/:id
  Response: { id, author_name, author_title, author_company, cilt_level, content, ... }
```

---

### 3.11 聯絡我們（contact.html）

#### 表單欄位
| 欄位 | 類型 | 必填 | 驗證 |
|------|------|------|------|
| 聯絡人姓名 | text | 是 | 最長 50 字 |
| Email | email | 是 | Email 格式驗證 |
| 電話 | tel | 否 | — |
| 公司名稱 | text | 否 | — |
| 詢問類別 | select | 是 | 研討會相關/課程內容/認證相關/其他 |
| 留言內容 | textarea | 是 | 最長 500 字 |

#### 功能
- 前端即時驗證
- 提交後寄送通知信給管理員
- 寄送確認信給填表人

#### API 規格
```
POST /api/contact
  Body: { name, email, phone, company, category, message }
  Response: { success: true, message: "已收到您的訊息" }
```

---

## 4. 會員系統規格

### 4.1 註冊流程

```
使用者填寫表單 → 系統驗證 → 建立帳號（未驗證）→ 寄送驗證信
→ 使用者點擊驗證連結 → 帳號啟用 → 可登入
```

#### 註冊表單欄位
| 欄位 | 類型 | 必填 |
|------|------|------|
| Email | email | 是 |
| 密碼 | password | 是（最少 8 字元） |
| 確認密碼 | password | 是 |
| 姓名 | text | 是 |
| 手機 | tel | 是 |
| 公司名稱 | text | 否 |
| 職稱 | text | 否 |

#### API 規格
```
POST /api/auth/register
  Body: { email, password, name, phone, company, title }
  Response: { message: "註冊成功，請至信箱驗證" }

GET /api/auth/verify-email?token=xxx
  Response: Redirect to login page
```

### 4.2 登入/登出

```
POST /api/auth/login
  Body: { email, password }
  Response: { token, member: { id, name, email, role, cilt_level } }

POST /api/auth/logout
  Auth: Bearer Token
  Response: { message: "已登出" }
```

### 4.3 忘記密碼

```
POST /api/auth/forgot-password
  Body: { email }
  Response: { message: "重設連結已寄出" }

POST /api/auth/reset-password
  Body: { token, new_password }
  Response: { message: "密碼已重設" }
```

### 4.4 會員中心

#### Dashboard
- 歡迎訊息 + 會員等級
- 最近報名課程
- 認證進度
- 繳費提醒

#### 個人資料
- 查看/編輯基本資料
- 修改密碼

#### 我的報名
- 報名紀錄列表
- 狀態：待繳費 / 已繳費 / 已取消
- 可取消未繳費的報名

#### 我的認證
- 目前 CILT 等級
- 認證歷程時間軸
- 學習建議

#### 繳費紀錄
- 所有繳費紀錄
- 狀態：待付款 / 已付款 / 已退款
- 收據下載

---

## 5. 付費系統規格

### 5.1 綠界 ECPay 串接

#### 付款流程
```
會員報名課程 → 產生訂單 → 導向綠界付款頁
→ 付款完成 → 綠界回調 → 更新訂單狀態
→ 導回網站顯示付款結果
```

#### 支援付款方式
- 信用卡（Visa/MasterCard/JCB）
- ATM 虛擬帳號
- 超商代碼繳費

#### API 規格
```
POST /api/payments/create
  Auth: Bearer Token
  Body: { registration_id }
  Response: { payment_form_html }（綠界表單自動提交）

POST /api/payments/callback
  Body: ECPay callback parameters
  Response: "1|OK"

GET /api/payments/return
  Query: ECPay return parameters
  Response: Redirect to payment result page

GET /api/payments/my
  Auth: Bearer Token
  Response: { data: [...] }
```

### 5.2 付款狀態
| 狀態 | 說明 |
|------|------|
| pending | 訂單建立，等待付款 |
| paid | 付款成功 |
| failed | 付款失敗 |
| refunded | 已退款 |

---

## 6. 管理後台規格

### 6.1 Dashboard
- 會員總數 / 本月新增
- 報名總數 / 本月報名
- 營收統計（本月/本季/年度）
- 待處理事項（未讀聯絡表單、待審報名等）

### 6.2 會員管理
| 功能 | 說明 |
|------|------|
| 列表 | 搜尋、篩選（角色/狀態/認證等級）、分頁 |
| 查看 | 會員完整資料、報名紀錄、繳費紀錄 |
| 編輯 | 修改基本資料、認證等級、角色 |
| 停用/啟用 | 停用帳號（保留資料） |
| 匯出 | CSV 格式匯出 |

```
GET /api/admin/members
  Query: page, limit, keyword, role, status, cilt_level
  Response: { data: [...], total }

PUT /api/admin/members/:id
  Body: { name, phone, role, cilt_level, status }
  Response: { member }

GET /api/admin/members/export
  Response: CSV file
```

### 6.3 內容管理

通用 CRUD 介面，適用於：最新消息、活動、下載、經驗分享

| 功能 | 說明 |
|------|------|
| 列表 | 搜尋、分類篩選、上架/下架狀態篩選 |
| 新增 | 表單 + 圖片/檔案上傳 |
| 編輯 | 同新增表單，預填現有資料 |
| 刪除 | 軟刪除（標記下架） |
| 上下架 | 切換 is_published 狀態 |

```
POST /api/admin/news
PUT /api/admin/news/:id
DELETE /api/admin/news/:id

POST /api/admin/activities
PUT /api/admin/activities/:id
DELETE /api/admin/activities/:id

POST /api/admin/downloads（含檔案上傳）
PUT /api/admin/downloads/:id
DELETE /api/admin/downloads/:id

POST /api/admin/columns
PUT /api/admin/columns/:id
DELETE /api/admin/columns/:id
```

### 6.4 報名管理
```
GET /api/admin/registrations
  Query: page, limit, status, payment_status, course_id
  Response: { data: [...], total }

PUT /api/admin/registrations/:id
  Body: { status }
  Response: { registration }
```

### 6.5 繳費管理
```
GET /api/admin/payments
  Query: page, limit, status, start_date, end_date
  Response: { data: [...], total, summary: { total_amount, paid_count } }
```

### 6.6 聯絡表單管理
```
GET /api/admin/contacts
  Query: page, limit, is_read, category
  Response: { data: [...], total }

PUT /api/admin/contacts/:id/read
  Response: { contact }
```

---

## 7. 資料庫 Schema

### 7.1 members
```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  title TEXT,
  cilt_level INTEGER DEFAULT 0,  -- 0=無, 1-4=Level 1-4
  role TEXT DEFAULT 'member',     -- member / admin
  status TEXT DEFAULT 'active',   -- active / inactive
  email_verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.2 news
```sql
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,          -- course_info / announcement / activity
  content TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  is_published INTEGER DEFAULT 1,
  author_id INTEGER REFERENCES members(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.3 activities
```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,          -- seminar / course / visit / forum / exhibition / lecture
  description TEXT,
  content TEXT,
  image_url TEXT,
  event_date DATE,
  event_end_date DATE,
  location TEXT,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.4 cert_levels
```sql
CREATE TABLE cert_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level_number INTEGER UNIQUE NOT NULL,  -- 1, 2, 3, 4
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  requirements TEXT,        -- JSON: 報考資格
  subjects TEXT,            -- JSON: 考試科目
  exam_format TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.5 courses
```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,               -- seminar / general / certification
  description TEXT,
  content TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  fee INTEGER DEFAULT 0,            -- 費用（新台幣）
  max_seats INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  cert_level_id INTEGER REFERENCES cert_levels(id),
  status TEXT DEFAULT 'open',       -- open / closed / cancelled
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.6 registrations
```sql
CREATE TABLE registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  status TEXT DEFAULT 'pending',         -- pending / confirmed / cancelled
  payment_status TEXT DEFAULT 'unpaid',  -- unpaid / paid / refunded
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, course_id)
);
```

### 7.7 payments
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  registration_id INTEGER REFERENCES registrations(id),
  amount INTEGER NOT NULL,               -- 金額（新台幣）
  method TEXT,                           -- credit_card / atm / cvs
  transaction_id TEXT,                   -- 系統訂單編號
  ecpay_trade_no TEXT,                   -- 綠界交易編號
  status TEXT DEFAULT 'pending',         -- pending / paid / failed / refunded
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.8 exams
```sql
CREATE TABLE exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_level_id INTEGER NOT NULL REFERENCES cert_levels(id),
  exam_date DATE,
  exam_end_date DATE,
  subjects TEXT,            -- JSON: 考試科目
  format TEXT,              -- written / report / thesis
  location TEXT,
  registration_deadline DATE,
  status TEXT DEFAULT 'scheduled',  -- scheduled / completed / cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.9 downloads
```sql
CREATE TABLE downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  members_only INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.10 columns（經驗分享）
```sql
CREATE TABLE columns_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  cilt_level INTEGER,
  year INTEGER,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT DEFAULT 'enterprise',  -- enterprise / student
  image_url TEXT,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.11 contacts
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  replied_at DATETIME,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.12 email_verifications
```sql
CREATE TABLE email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7.13 password_resets
```sql
CREATE TABLE password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. 設計規格

### 8.1 色彩系統
```css
--navy-dark: #0a1628;
--navy-light: #162240;
--teal: #00d4aa;
--teal-light: #00e8bb;
--teal-dim: rgba(0, 212, 170, 0.15);
--text-dark: #1a2236;
--text-body: #4a5568;
--text-light: #94a3b8;
--gray-50: #f8f9fb;
--gray-100: #f1f3f7;
--gray-200: #e2e8f0;
--white: #ffffff;
--danger: #ef4444;
--warning: #f59e0b;
--success: #10b981;
```

### 8.2 字體
```css
font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif;
```
- 標題：700-900 weight
- 內文：400 weight
- 輔助文字：300 weight

### 8.3 元件規格

| 元件 | 圓角 | 陰影 | 動畫 |
|------|------|------|------|
| 卡片 | 12px | 0 2px 12px rgba(0,0,0,0.08) | hover: translateY(-2px) |
| 按鈕 | 8px | — | hover: opacity 0.9 |
| 輸入框 | 8px | — | focus: teal border |
| 導航列 | — | backdrop-blur(12px) | — |
| 模態框 | 16px | 0 20px 60px rgba(0,0,0,0.3) | fadeIn |

### 8.4 響應式斷點
| 裝置 | 寬度 | 欄數 |
|------|------|------|
| Desktop | > 1100px | 3-4 欄 |
| Tablet | 768-1100px | 2 欄 |
| Mobile | < 768px | 1 欄 |

---

## 9. 安全規格

| 項目 | 措施 |
|------|------|
| 密碼儲存 | bcrypt（salt rounds: 12） |
| 認證 | JWT（有效期 7 天）+ HttpOnly Cookie |
| XSS | 輸入 HTML escape + CSP header |
| CSRF | SameSite cookie + token 驗證 |
| SQL Injection | Prepared statements（better-sqlite3 內建） |
| Rate Limiting | express-rate-limit（登入: 5次/15分, API: 100次/15分） |
| 檔案上傳 | 檔案類型白名單 + 大小限制（10MB） |
| CORS | 僅允許同源 |
| Input Validation | express-validator |

---

## 10. 目錄結構

```
cilt-website/
├── package.json
├── server.js
├── .env.example
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── database.sqlite（自動生成）
├── routes/
│   ├── auth.js
│   ├── members.js
│   ├── news.js
│   ├── activities.js
│   ├── certifications.js
│   ├── courses.js
│   ├── registrations.js
│   ├── exams.js
│   ├── downloads.js
│   ├── columns.js
│   ├── contact.js
│   ├── payments.js
│   └── admin.js
├── middleware/
│   ├── auth.js
│   ├── upload.js
│   └── validate.js
├── utils/
│   ├── email.js
│   ├── ecpay.js
│   └── helpers.js
├── public/
│   ├── index.html
│   ├── about.html
│   ├── news.html
│   ├── activities.html
│   ├── certification.html
│   ├── register.html
│   ├── exam.html
│   ├── downloads.html
│   ├── columns.html
│   ├── contact.html
│   ├── login.html
│   ├── signup.html
│   ├── forgot-password.html
│   ├── member/
│   │   ├── dashboard.html
│   │   ├── profile.html
│   │   ├── my-courses.html
│   │   ├── my-certs.html
│   │   └── payments.html
│   ├── admin/
│   │   ├── index.html
│   │   ├── members.html
│   │   ├── content.html
│   │   ├── registrations.html
│   │   └── payments.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   └── admin.js
│   ├── images/
│   └── uploads/
└── README.md
```

---

## 11. 實作階段

| 階段 | 內容 | 預計頁面/檔案數 |
|------|------|-----------------|
| 1 | 專案骨架 + 資料庫 + 共用元件 + 首頁 | 5 |
| 2 | 靜態內容頁面（關於/認證/考試）+ 列表頁面 API（消息/活動/下載/專欄/聯絡） | 12 |
| 3 | 會員系統（註冊/登入/密碼重設/會員中心） | 8 |
| 4 | 線上報名 + 綠界金流串接 | 4 |
| 5 | 管理後台 | 5 |
| 6 | Seed 資料 + 安全性 + 測試 | — |

---

## 12. 環境變數

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=CILT台灣分會 <noreply@cilt.org.tw>

# ECPay
ECPAY_MERCHANT_ID=your-merchant-id
ECPAY_HASH_KEY=your-hash-key
ECPAY_HASH_IV=your-hash-iv
ECPAY_RETURN_URL=https://your-domain/api/payments/callback
ECPAY_CLIENT_BACK_URL=https://your-domain/member/payments.html

# Site
SITE_URL=http://localhost:3000
SITE_NAME=CILT台灣分會
```
