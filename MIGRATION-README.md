# Database Migration: Add period_topics Table

## สรุปการเปลี่ยนแปลง

การ migration นี้แก้ไขปัญหาเรื่อง **evaluatee ไม่เห็นหัวข้อการประเมิน** โดย:

1. ✅ **สร้างตาราง `period_topics`** - เชื่อม evaluation_periods กับ evaluation_topics (Many-to-Many)
2. ✅ **Populate ข้อมูล** - ผูกทุก topic เข้ากับทุก period อัตโนมัติ
3. ✅ **ลบตารางที่ไม่ได้ใช้** - vocational_categories, vocational_fields, org_groups, dept_fields
4. ✅ **ปรับปรุง departments table** - ลด column ที่ไม่จำเป็น

## วิธีรัน Migration

### Option 1: ผ่าน phpMyAdmin (แนะนำ)

1. เปิด phpMyAdmin
2. เลือก database `skills_db`
3. คลิก tab "SQL"
4. Copy SQL จากไฟล์ `migration-add-period-topics.sql`
5. Paste และกด "Go"

### Option 2: ผ่าน MySQL CLI

```bash
mysql -u root -p skills_db < migration-add-period-topics.sql
```

### Option 3: ผ่าน Node.js (ถ้ามี backend running)

```bash
cd backend
node migrations/add-period-topics.js
```

## ผลลัพธ์ที่คาดหวัง

หลังรัน migration:

1. ✅ ตาราง `period_topics` ถูกสร้าง
2. ✅ ข้อมูลถูก populate (ทุก period จะมีทุก topic)
3. ✅ Evaluatee จะเห็นหัวข้อการประเมินในหน้า "ประเมินตนเอง"
4. ✅ Database สะอาดขึ้น (ตารางที่ไม่ใช้ถูกลบ)

## โครงสร้าง period_topics

```sql
CREATE TABLE period_topics (
  period_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, topic_id),
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE
);
```

## ตัวอย่างข้อมูลที่ Populate

ถ้ามี:
- 2 periods (period_id: 1, 4)
- 5 topics (topic_id: 1, 2, 3, 4, 5)

จะได้ 10 rows:
```
period_id | topic_id
----------|----------
1         | 1
1         | 2
1         | 3
1         | 4
1         | 5
4         | 1
4         | 2
4         | 3
4         | 4
4         | 5
```

## การทำงานของระบบหลัง Migration

### Backend API
```
GET /api/topics?period_id=1  → ดึง topics สำหรับ period 1
GET /api/topics              → ดึง topics ทั้งหมด
```

### Frontend
```js
// เดิม: ดึงทั้งหมดแล้ว filter ใน frontend
const topics = await topicService.getAll();
const filtered = topics.filter(t => t.period_id === periodId);

// ใหม่: backend filter ให้เลย
const topics = await topicService.getAll(periodId);
```

## ตรวจสอบว่า Migration สำเร็จ

รัน query นี้เพื่อเช็ค:

```sql
-- เช็คว่าตาราง period_topics มีข้อมูล
SELECT COUNT(*) FROM period_topics;

-- เช็คว่า period แต่ละ period มี topic ครบ
SELECT p.id, p.name_th, COUNT(pt.topic_id) as topic_count
FROM evaluation_periods p
LEFT JOIN period_topics pt ON p.id = pt.period_id
GROUP BY p.id, p.name_th;

-- ควรได้ topic_count = จำนวน topics ทั้งหมด
```

## Rollback (ถ้าต้องการยกเลิก)

```sql
-- ลบตาราง period_topics
DROP TABLE IF EXISTS period_topics;

-- (ไม่สามารถกู้คืนตารางที่ถูกลบได้ ต้องมี backup)
```

## ⚠️ คำเตือน

1. **Backup database ก่อนรัน migration!**
2. **ตรวจสอบว่าไม่มีข้อมูลสำคัญในตารางที่จะลบ:**
   - vocational_categories
   - vocational_fields
   - org_groups
   - dept_fields
3. **ถ้าต้องการเก็บตารางเหล่านี้** - comment บรรทัด DROP TABLE ใน migration script

## สรุปไฟล์ที่เปลี่ยน

```
backend/
  ├── migrations/add-period-topics.js       [NEW] - Migration script
  ├── repositories/topics.repository.js     [MODIFIED] - รองรับ period_id
  └── controllers/topics.controller.js      [MODIFIED] - รองรับ period_id

frontend/
  ├── src/services/topicService.js          [MODIFIED] - รองรับ period_id
  ├── src/views/evaluatee/SelfEvaluation.vue      [MODIFIED] - ส่ง period_id
  └── src/views/evaluatee/EvaluateeDashboard.vue  [MODIFIED] - ส่ง period_id

database/
  └── migration-add-period-topics.sql       [NEW] - SQL migration script
```

## คำถามที่พบบ่อย

**Q: ถ้าสร้าง period ใหม่ต้องทำอะไร?**
A: ต้อง insert ข้อมูลใน period_topics ด้วย:
```sql
INSERT INTO period_topics (period_id, topic_id)
SELECT [new_period_id], id FROM evaluation_topics;
```

**Q: ถ้าสร้าง topic ใหม่ต้องทำอะไร?**
A: ต้อง link เข้ากับทุก period:
```sql
INSERT INTO period_topics (period_id, topic_id)
SELECT id, [new_topic_id] FROM evaluation_periods;
```

**Q: ทำไมไม่ใช้ period_id ใน evaluation_topics เลย?**
A: เพื่อให้ topic สามารถใช้ซ้ำได้ในหลาย period โดยไม่ต้อง duplicate ข้อมูล

---

**Created:** 2025-11-20
**Branch:** claude/fix-evaluatee-assignments-01JXcnxpsZKGK3SpkeC985zS
