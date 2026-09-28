-- ============ اليسر — MySQL Schema (mirrors Cloud schema) ============
CREATE DATABASE IF NOT EXISTS alyusr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alyusr;

CREATE TABLE IF NOT EXISTS users (
  id           CHAR(36) PRIMARY KEY,
  email        VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name    VARCHAR(190) NOT NULL DEFAULT '',
  phone        VARCHAR(40),
  city         VARCHAR(120),
  avatar_url   TEXT,
  bio          TEXT,
  skills       JSON,
  preferred_program VARCHAR(120),
  total_donated DECIMAL(12,2) NOT NULL DEFAULT 0,
  donations_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  id      CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role    ENUM('admin','case_manager','volunteer','donor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS case_categories (
  id   CHAR(36) PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name_ar VARCHAR(190) NOT NULL,
  name_en VARCHAR(190) NOT NULL,
  icon VARCHAR(80),
  description_ar TEXT,
  description_en TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cases (
  id CHAR(36) PRIMARY KEY,
  ref_code VARCHAR(40) UNIQUE NOT NULL,
  category_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  story TEXT NOT NULL,
  beneficiary_name VARCHAR(190) NOT NULL,
  beneficiary_age INT,
  beneficiary_gender ENUM('male','female'),
  governorate VARCHAR(120) NOT NULL DEFAULT 'الدقهلية',
  city VARCHAR(120),
  cover_image_url TEXT,
  needed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  urgency ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status ENUM('draft','pending','approved','funded','closed','rejected') NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  created_by CHAR(36),
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  FOREIGN KEY (category_id) REFERENCES case_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS case_updates (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  author_id CHAR(36),
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS case_documents (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  storage_path TEXT NOT NULL,
  doc_type VARCHAR(60) NOT NULL DEFAULT 'document',
  caption TEXT,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS donations (
  id CHAR(36) PRIMARY KEY,
  ref_code VARCHAR(40) UNIQUE NOT NULL,
  donor_id CHAR(36),
  case_id CHAR(36),
  category_id CHAR(36),
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EGP',
  donor_name VARCHAR(190),
  donor_email VARCHAR(190),
  donor_phone VARCHAR(40),
  message TEXT,
  payment_method VARCHAR(60),
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_donor (donor_id),
  INDEX idx_case (case_id)
) ENGINE=InnoDB;