// backend/repositories/assignments.repository.js
// Repository สำหรับจัดการ assignments (การมอบหมายงานประเมิน)

const db = require('../db/knex');
const TABLE = 'assignments';

// ============================================================
// ฟังก์ชันเดิม - ตรวจสอบสิทธิ์
// ============================================================

// ยืนยันว่า evaluatee อยู่ในงวดนั้น (ไม่ผูก evaluator)
exports.hasEvaluateeInPeriod = async ({ period_id, evaluatee_id }) => {
  const row = await db(TABLE).where({ period_id, evaluatee_id }).first();
  return !!row;
};

// ยืนยันสิทธิ evaluator ต่อ evaluatee ในงวดนั้น
exports.hasPairInPeriod = async ({ period_id, evaluator_id, evaluatee_id }) => {
  const row = await db(TABLE)
    .where({ period_id, evaluator_id, evaluatee_id })
    .first();
  return !!row;
};

// ============================================================
// ฟังก์ชัน CRUD พื้นฐาน
// ============================================================

// ดึงทั้งหมด พร้อม JOIN
exports.findAll = async () => {
  return db(TABLE)
    .select(
      'assignments.*',
      'evaluator.name_th as evaluator_name',
      'evaluatee.name_th as evaluatee_name',
      'periods.name_th as period_name'
    )
    .leftJoin('users as evaluator', 'assignments.evaluator_id', 'evaluator.id')
    .leftJoin('users as evaluatee', 'assignments.evaluatee_id', 'evaluatee.id')
    .leftJoin('evaluation_periods as periods', 'assignments.period_id', 'periods.id')
    .orderBy('assignments.created_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงงานที่กรรมการได้รับมอบหมาย พร้อม JOIN
exports.findByEvaluator = async (evaluatorId) => {
  return db(TABLE)
    .select(
      'assignments.*',
      'evaluatee.name_th as evaluatee_name',
      'periods.name_th as period_name'
    )
    .leftJoin('users as evaluatee', 'assignments.evaluatee_id', 'evaluatee.id')
    .leftJoin('evaluation_periods as periods', 'assignments.period_id', 'periods.id')
    .where('assignments.evaluator_id', evaluatorId)
    .orderBy('assignments.created_at', 'desc');
};

// ============================================================
// ⭐⭐⭐ ฟังก์ชันใหม่ - สำหรับ evaluatee ⭐⭐⭐
// ============================================================

// ดึงงานของผู้ถูกประเมิน (evaluatee)
// ใช้สำหรับให้ evaluatee ดูว่าถูกใครประเมินบ้าง
exports.findByEvaluatee = async (evaluateeId, periodId = null) => {
  let query = db(TABLE)
    .select(
      'assignments.*',
      'evaluator.name_th as evaluator_name',
      'periods.name_th as period_name',
      'periods.start_date',
      'periods.end_date',
      'periods.is_active'
    )
    .leftJoin('users as evaluator', 'assignments.evaluator_id', 'evaluator.id')
    .leftJoin('evaluation_periods as periods', 'assignments.period_id', 'periods.id')
    .where('assignments.evaluatee_id', evaluateeId);

  if (periodId) query = query.andWhere('assignments.period_id', periodId);

  return query.orderBy('assignments.created_at', 'desc');
};

// ============================================================
// ฟังก์ชันอื่นๆ
// ============================================================

// ดึงตาม period พร้อม JOIN
exports.findByPeriod = async (periodId) => {
  return db(TABLE)
    .select(
      'assignments.*',
      'evaluator.name_th as evaluator_name',
      'evaluatee.name_th as evaluatee_name'
    )
    .leftJoin('users as evaluator', 'assignments.evaluator_id', 'evaluator.id')
    .leftJoin('users as evaluatee', 'assignments.evaluatee_id', 'evaluatee.id')
    .where('assignments.period_id', periodId)
    .orderBy('assignments.created_at', 'desc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const exists = await exports.hasPairInPeriod({
    period_id: payload.period_id,
    evaluator_id: payload.evaluator_id,
    evaluatee_id: payload.evaluatee_id
  });
  if (exists) throw new Error('Assignment already exists');

  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// สร้างหลายรายการ (Skip รายการที่ซ้ำ)
exports.createBulk = async (items) => {
  const created = [];
  const skipped = [];

  for (const item of items) {
    // Filter out fields ที่ไม่ต้องการ (เช่น role_type ที่ไม่มีใน schema)
    const cleanItem = {
      period_id: item.period_id,
      evaluator_id: item.evaluator_id,
      evaluatee_id: item.evaluatee_id
    };

    const exists = await exports.hasPairInPeriod({
      period_id: cleanItem.period_id,
      evaluator_id: cleanItem.evaluator_id,
      evaluatee_id: cleanItem.evaluatee_id
    });

    if (exists) {
      skipped.push({
        evaluator_id: cleanItem.evaluator_id,
        evaluatee_id: cleanItem.evaluatee_id,
        reason: 'already exists'
      });
    } else {
      const [id] = await db(TABLE).insert(cleanItem);
      created.push(id);
    }
  }

  return {
    created: created.length,
    skipped: skipped.length,
    total: items.length,
    details: { created, skipped }
  };
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// ลบทั้งหมดใน period
exports.removeByPeriod = async (periodId) => {
  return db(TABLE).where({ period_id: periodId }).del();
};