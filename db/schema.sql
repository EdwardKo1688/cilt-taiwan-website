-- CILT 台灣分會網站 資料庫 Schema

-- 會員
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  title TEXT,
  cilt_level INTEGER DEFAULT 0,
  role TEXT DEFAULT 'member' CHECK(role IN ('member', 'admin')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  email_verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 最新消息
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('course_info', 'announcement', 'activity')),
  content TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  is_published INTEGER DEFAULT 1,
  author_id INTEGER REFERENCES members(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 活動
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('seminar', 'course', 'visit', 'forum', 'exhibition', 'lecture', 'meeting')),
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

-- 認證等級
CREATE TABLE IF NOT EXISTS cert_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level_number INTEGER UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  subjects TEXT,
  exam_format TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 課程
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('seminar', 'general', 'certification')),
  description TEXT,
  content TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  fee INTEGER DEFAULT 0,
  max_seats INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  cert_level_id INTEGER REFERENCES cert_levels(id),
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'cancelled')),
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 報名紀錄
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, course_id)
);

-- 付費紀錄
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  registration_id INTEGER REFERENCES registrations(id),
  amount INTEGER NOT NULL,
  method TEXT,
  transaction_id TEXT UNIQUE,
  ecpay_trade_no TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 考試
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_level_id INTEGER NOT NULL REFERENCES cert_levels(id),
  exam_date DATE,
  exam_end_date DATE,
  subjects TEXT,
  format TEXT,
  location TEXT,
  registration_deadline DATE,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 下載檔案
CREATE TABLE IF NOT EXISTS downloads (
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

-- 經驗分享
CREATE TABLE IF NOT EXISTS columns_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  cilt_level INTEGER,
  year INTEGER,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT DEFAULT 'enterprise' CHECK(category IN ('enterprise', 'student')),
  image_url TEXT,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 聯絡表單
CREATE TABLE IF NOT EXISTS contacts (
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

-- Email 驗證
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 密碼重設
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(event_date);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_registrations_member ON registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course ON registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_downloads_category ON downloads(category);
CREATE INDEX IF NOT EXISTS idx_columns_category ON columns_articles(category);
CREATE INDEX IF NOT EXISTS idx_contacts_read ON contacts(is_read);
