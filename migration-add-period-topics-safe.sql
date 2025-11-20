-- ============================================================================
-- MIGRATION: Add period_topics table and cleanup (SAFE VERSION)
-- Created: 2025-11-20
-- Compatible with MySQL 5.7+
-- แก้ไข: ข้าม UPDATE แล้วลบ column/table ไปเลย
-- ============================================================================

USE skills_db;

-- ============================================================================
-- 1. สร้างตาราง period_topics (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS period_topics (
  period_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, topic_id),
  CONSTRAINT fk_pt_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pt_topic
    FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 2. Populate ข้อมูล: ผูก topics ทั้งหมดเข้ากับ periods ทั้งหมด
-- ============================================================================

INSERT IGNORE INTO period_topics (period_id, topic_id)
SELECT p.id, t.id
FROM evaluation_periods p
CROSS JOIN evaluation_topics t;

-- ============================================================================
-- 3. ลบ Foreign Key Constraints ก่อน
-- ============================================================================

-- ลบ FK จาก departments
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='';
ALTER TABLE departments DROP FOREIGN KEY fk_dept_cat;
ALTER TABLE departments DROP FOREIGN KEY fk_dept_org;
SET SQL_MODE=@OLD_SQL_MODE;

-- ลบ FK จาก users
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='';
ALTER TABLE users DROP FOREIGN KEY fk_users_org;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- 4. ลบ columns จาก departments ก่อน (ไม่ต้อง UPDATE เป็น NULL)
-- ============================================================================

SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='';
ALTER TABLE departments DROP COLUMN category_id;
ALTER TABLE departments DROP COLUMN org_group_id;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- 5. ลบ column จาก users
-- ============================================================================

SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='';
ALTER TABLE users DROP COLUMN org_group_id;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- 6. ลบตารางที่ไม่ได้ใช้งาน
-- ============================================================================

DROP TABLE IF EXISTS dept_fields;
DROP TABLE IF EXISTS vocational_fields;
DROP TABLE IF EXISTS vocational_categories;
DROP TABLE IF EXISTS org_groups;

-- ============================================================================
-- 7. Verify - เช็คว่า period_topics มีข้อมูล
-- ============================================================================

SELECT
  'period_topics created successfully' as status,
  COUNT(*) as total_links
FROM period_topics;

SELECT 'Migration completed successfully!' AS result;
