-- ============================================================================
-- MIGRATION: Add period_topics table and cleanup unused tables
-- Created: 2025-11-20
-- Purpose: Link evaluation_topics with evaluation_periods (Many-to-Many)
--          และลบตารางที่ไม่ได้ใช้งาน
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
-- 2. Populate ข้อมูล: ผูกทุก topic เข้ากับทุก period
-- ============================================================================

INSERT INTO period_topics (period_id, topic_id)
SELECT p.id, t.id
FROM evaluation_periods p
CROSS JOIN evaluation_topics t
WHERE NOT EXISTS (
  SELECT 1 FROM period_topics pt
  WHERE pt.period_id = p.id AND pt.topic_id = t.id
);

-- ============================================================================
-- 3. ลบตารางที่ไม่ได้ใช้งาน (ตามความต้องการ)
-- ============================================================================

-- ⚠️ หมายเหตุ: ตรวจสอบให้แน่ใจว่าไม่มีข้อมูลสำคัญในตารางเหล่านี้ก่อนลบ
-- คอมเมนต์บรรทัดไหนที่ยังต้องการใช้งาน

-- ลบตาราง dept_fields (เชื่อมแผนก-สาขา)
DROP TABLE IF EXISTS dept_fields;

-- ลบตาราง vocational_fields (สาขาวิชา)
DROP TABLE IF EXISTS vocational_fields;

-- ลบตาราง vocational_categories (หมวดหมู่สาขา)
DROP TABLE IF EXISTS vocational_categories;

-- ลบตาราง org_groups (กลุ่มองค์กร)
-- ⚠️ หมายเหตุ: ถ้า users.org_group_id ยังใช้อยู่ ต้อง SET NULL ก่อน
UPDATE users SET org_group_id = NULL WHERE org_group_id IS NOT NULL;
DROP TABLE IF EXISTS org_groups;

-- ============================================================================
-- 4. ปรับปรุง departments table (ลดความซับซ้อน)
-- ============================================================================

-- เอา FK ที่ไม่ได้ใช้ออก (ถ้าลบ org_groups และ categories แล้ว)
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS fk_dept_cat;
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS fk_dept_org;

-- เปลี่ยน departments ให้เรียบง่ายขึ้น
ALTER TABLE departments
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS org_group_id;

-- ============================================================================
-- 5. สรุปโครงสร้างใหม่
-- ============================================================================

-- ตารางที่เหลือ:
-- ✅ users (ผู้ใช้)
-- ✅ departments (แผนก - เรียบง่าย)
-- ✅ evaluation_periods (รอบประเมิน)
-- ✅ evaluation_topics (หัวข้อ)
-- ✅ period_topics (เชื่อม period-topic) **NEW**
-- ✅ indicators (ตัวชี้วัด)
-- ✅ evidence_types (ชนิดหลักฐาน)
-- ✅ indicator_evidence (เชื่อม indicator-evidence)
-- ✅ assignments (มอบหมายงาน)
-- ✅ evaluation_results (ผลการประเมิน)
-- ✅ attachments (ไฟล์แนบ)
-- ✅ signatures (ลายเซ็น)
-- ✅ evaluator_comments (ความคิดเห็น)

SELECT 'Migration completed successfully!' AS status;
