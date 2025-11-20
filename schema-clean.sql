-- ============================================================================
-- CLEAN SCHEMA - ระบบประเมินบุคลากร (Essential Tables Only)
-- Created: 2025-11-20
-- Purpose: เอาเฉพาะตารางที่ใช้งานจริงเท่านั้น
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS skills_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE skills_db;

-- ============================================================================
-- DROP TABLES (ตารางที่ใช้จริงเท่านั้น)
-- ============================================================================

DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS evaluator_comments;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS evaluation_results;
DROP TABLE IF EXISTS indicator_evidence;
DROP TABLE IF EXISTS evidence_types;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS period_topics;
DROP TABLE IF EXISTS indicators;
DROP TABLE IF EXISTS evaluation_topics;
DROP TABLE IF EXISTS evaluation_periods;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- ============================================================================
-- 1. ตาราง departments (เรียบง่าย - แค่ id, code, name_th)
-- ============================================================================

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 2. ตาราง users
-- ============================================================================

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  role ENUM('admin','evaluator','evaluatee') NOT NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  department_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dept ON users(department_id);

-- ============================================================================
-- 3. ตาราง evaluation_periods
-- ============================================================================

CREATE TABLE evaluation_periods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  buddhist_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_periods_active ON evaluation_periods(is_active);
CREATE INDEX idx_periods_year ON evaluation_periods(buddhist_year);

-- ============================================================================
-- 4. ตาราง evaluation_topics
-- ============================================================================

CREATE TABLE evaluation_topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  title_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 5. ตาราง period_topics (Many-to-Many)
-- ============================================================================

CREATE TABLE period_topics (
  period_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, topic_id),
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 6. ตาราง indicators
-- ============================================================================

CREATE TABLE indicators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type ENUM('score_1_4','yes_no','file_url') NOT NULL DEFAULT 'score_1_4',
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  min_score TINYINT NOT NULL DEFAULT 1,
  max_score TINYINT NOT NULL DEFAULT 4,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_ind_topic (topic_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. ตาราง evidence_types
-- ============================================================================

CREATE TABLE evidence_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 8. ตาราง indicator_evidence
-- ============================================================================

CREATE TABLE indicator_evidence (
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  PRIMARY KEY (indicator_id, evidence_type_id),
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 9. ตาราง assignments
-- ============================================================================

CREATE TABLE assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  role_type ENUM('chairman','member') NOT NULL DEFAULT 'member',
  dept_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_assign_evaluator (evaluator_id, period_id),
  KEY idx_assign_evaluatee (evaluatee_id, period_id),
  UNIQUE KEY uk_assign (period_id, evaluator_id, evaluatee_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 10. ตาราง evaluation_results
-- ============================================================================

CREATE TABLE evaluation_results (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,

  -- คะแนนประเมินตนเอง
  self_selected_value INT NULL,
  self_score DECIMAL(5,2) NULL,
  self_note TEXT NULL,
  self_submitted_at TIMESTAMP NULL,

  -- คะแนนจากกรรมการ
  evaluator_selected_value INT NULL,
  evaluator_score DECIMAL(5,2) NULL,
  evaluator_id BIGINT UNSIGNED NULL,
  evaluator_note TEXT NULL,
  evaluated_at TIMESTAMP NULL,

  -- สถานะ
  status ENUM('draft','submitted','evaluated','approved') NOT NULL DEFAULT 'draft',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_results_evale (evaluatee_id, period_id),
  KEY idx_results_indicator (indicator_id),
  KEY idx_results_status (status),
  UNIQUE KEY uk_results (period_id, evaluatee_id, indicator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 11. ตาราง attachments
-- ============================================================================

CREATE TABLE attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  storage_path VARCHAR(1024) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_attach_evale (evaluatee_id, period_id),
  KEY idx_attach_indicator (indicator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 12. ตาราง signatures
-- ============================================================================

CREATE TABLE signatures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  result_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES evaluation_results(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_sig_result (result_id),
  UNIQUE KEY uk_sig (result_id, evaluator_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 13. ตาราง evaluator_comments
-- ============================================================================

CREATE TABLE evaluator_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type ENUM('general','strength','improvement') NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_comment_evaluatee (evaluatee_id, period_id),
  KEY idx_comment_evaluator (evaluator_id, period_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Departments (เรียบง่าย)
INSERT INTO departments (code, name_th) VALUES
('DEPT01','แผนกเทคโนโลยีสารสนเทศ'),
('DEPT02','แผนกบริหารธุรกิจ'),
('DEPT03','แผนกบริหารงานทั่วไป');

-- Users (password: password123)
INSERT INTO users (email, password_hash, name_th, role, status, department_id) VALUES
('admin@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบ', 'admin', 'active', 1),
('evaluator1@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อ.สมชาย ใจดี', 'evaluator', 'active', 1),
('evaluator2@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'อ.สมหญิง รักงาน', 'evaluator', 'active', 1),
('teacher1@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 01', 'evaluatee', 'active', 1),
('teacher2@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 02', 'evaluatee', 'active', 1),
('teacher3@ccollege.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ครูไอที 03', 'evaluatee', 'active', 1);

-- Evaluation Periods
INSERT INTO evaluation_periods (code, name_th, buddhist_year, start_date, end_date, is_active) VALUES
('P2568-1','รอบที่ 1 ปีการศึกษา 2568', 2568, '2025-01-01', '2025-06-30', 1),
('P2568-2','รอบที่ 2 ปีการศึกษา 2568', 2568, '2025-07-01', '2025-12-31', 0);

-- Evaluation Topics
INSERT INTO evaluation_topics (code, title_th, description, weight, active) VALUES
('T01','ด้านการจัดการเรียนการสอน','ประเมินการจัดการเรียนการสอนและพัฒนาหลักสูตร',30.00,1),
('T02','ด้านการบริหารจัดการ','ประเมินการบริหารจัดการและภาวะผู้นำ',25.00,1),
('T03','ด้านการพัฒนาตนเอง','ประเมินการพัฒนาตนเองและเพิ่มพูนความรู้',20.00,1),
('T04','ด้านการบริการวิชาการ','ประเมินการให้บริการวิชาการแก่สังคม',15.00,1),
('T05','ด้านการวิจัย','ประเมินการทำวิจัยและพัฒนานวัตกรรม',10.00,1);

-- Period-Topics: ผูกทุก topic เข้ากับทุก period
INSERT INTO period_topics (period_id, topic_id)
SELECT p.id, t.id
FROM evaluation_periods p
CROSS JOIN evaluation_topics t;

-- Indicators
INSERT INTO indicators (topic_id, code, name_th, description, type, weight, min_score, max_score, active) VALUES
(1,'IND-T01-01','จัดทำแผนการสอนครบถ้วน','มีแผนการสอนที่สมบูรณ์ ครอบคลุมเนื้อหาตามหลักสูตร','score_1_4',5.00,1,4,1),
(1,'IND-T01-02','ใช้สื่อการสอนที่หลากหลาย','มีการใช้สื่อการสอนที่เหมาะสมและทันสมัย','score_1_4',5.00,1,4,1),
(1,'IND-T01-03','ผลการเรียนนักเรียนผ่านเกณฑ์','นักเรียนมีผลการเรียนผ่านเกณฑ์ไม่น้อยกว่า 80%','yes_no',5.00,0,1,1),
(2,'IND-T02-01','เข้าร่วมประชุมครบถ้วน','เข้าร่วมประชุมครบตามกำหนด','yes_no',5.00,0,1,1),
(2,'IND-T02-02','ปฏิบัติงานตามหน้าที่','ปฏิบัติงานตามที่ได้รับมอบหมายอย่างมีประสิทธิภาพ','score_1_4',5.00,1,4,1),
(3,'IND-T03-01','อบรมพัฒนาตนเอง','เข้าร่วมอบรมพัฒนาตนเองไม่น้อยกว่า 20 ชั่วโมง/ปี','score_1_4',5.00,1,4,1),
(3,'IND-T03-02','ศึกษาต่อระดับสูงขึ้น','มีการศึกษาต่อหรือพัฒนาวุฒิการศึกษา','yes_no',5.00,0,1,1);

-- Evidence Types
INSERT INTO evidence_types (code, name_th, description) VALUES
('EV01','แผนการสอน','ไฟล์เอกสารแผนการสอน (PDF)'),
('EV02','ภาพถ่ายกิจกรรม','ภาพถ่ายการจัดกิจกรรม (JPG/PNG)'),
('EV03','เอกสารรับรอง','เอกสารรับรองจากหน่วยงาน (PDF)'),
('EV04','ใบประกาศนียบัตร','ใบประกาศนียบัตรการอบรม (PDF)'),
('EV05','URL/Link','ลิงก์เว็บไซต์หรือเอกสารออนไลน์');

-- Indicator-Evidence Mapping
INSERT INTO indicator_evidence (indicator_id, evidence_type_id) VALUES
(1,1), (2,2), (2,5), (3,3), (4,3), (5,3), (5,2), (6,4), (7,3);

-- Assignments
INSERT INTO assignments (period_id, evaluator_id, evaluatee_id, role_type, dept_id) VALUES
(1, 2, 4, 'chairman', 1),
(1, 3, 4, 'member', 1),
(1, 2, 5, 'chairman', 1),
(1, 3, 6, 'chairman', 1);

-- ============================================================================
-- สรุปโครงสร้าง (13 ตาราง)
-- ============================================================================
-- 1. departments - แผนก (เรียบง่าย)
-- 2. users - ผู้ใช้งาน
-- 3. evaluation_periods - รอบการประเมิน
-- 4. evaluation_topics - หัวข้อการประเมิน
-- 5. period_topics - เชื่อม period-topic (Many-to-Many)
-- 6. indicators - ตัวชี้วัด
-- 7. evidence_types - ประเภทหลักฐาน
-- 8. indicator_evidence - เชื่อม indicator-evidence
-- 9. assignments - มอบหมายงาน
-- 10. evaluation_results - ผลการประเมิน
-- 11. attachments - ไฟล์แนบ
-- 12. signatures - ลายเซ็น
-- 13. evaluator_comments - ความคิดเห็นกรรมการ
-- ============================================================================

SELECT 'Clean schema created successfully!' AS status;
