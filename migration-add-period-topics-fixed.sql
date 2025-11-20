-- ============================================================================
-- MIGRATION: Add period_topics table and cleanup (FIXED VERSION)
-- Created: 2025-11-20
-- Purpose: Link evaluation_topics with evaluation_periods (Many-to-Many)
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
-- 3. ลบ Foreign Key Constraints ก่อน (สำคัญมาก!)
-- ============================================================================

-- ลบ FK จาก departments
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS fk_dept_cat;
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS fk_dept_org;

-- ลบ FK จาก users (ถ้ามี)
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_org;

-- ============================================================================
-- 4. SET NULL ให้กับ columns ที่ reference ตารางที่จะลบ
-- ============================================================================

UPDATE users SET org_group_id = NULL WHERE org_group_id IS NOT NULL;
UPDATE departments SET category_id = NULL WHERE category_id IS NOT NULL;
UPDATE departments SET org_group_id = NULL WHERE org_group_id IS NOT NULL;

-- ============================================================================
-- 5. ลบตารางที่ไม่ได้ใช้งาน
-- ============================================================================

DROP TABLE IF EXISTS dept_fields;
DROP TABLE IF EXISTS vocational_fields;
DROP TABLE IF EXISTS vocational_categories;
DROP TABLE IF EXISTS org_groups;

-- ============================================================================
-- 6. ลบ columns ที่ไม่ใช้แล้วออกจาก departments
-- ============================================================================

ALTER TABLE departments
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS org_group_id;

-- ============================================================================
-- 7. ลบ column org_group_id จาก users (ถ้าไม่ใช้)
-- ============================================================================

ALTER TABLE users
  DROP COLUMN IF EXISTS org_group_id;

-- ============================================================================
-- 8. Verify - เช็คว่า period_topics มีข้อมูล
-- ============================================================================

SELECT
  'period_topics created successfully' as status,
  COUNT(*) as total_links
FROM period_topics;

SELECT 'Migration completed successfully!' AS result;
