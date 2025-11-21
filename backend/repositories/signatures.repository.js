// backend/repositories/signatures.repository.js
// Repository สำหรับจัดการลายเซ็นดิจิทัล
const db = require('../db/knex');
const TABLE = 'signatures';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE)
    .select('signatures.*', 'users.name_th as evaluator_name')
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .orderBy('signatures.signed_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE)
    .select('signatures.*', 'users.name_th as evaluator_name')
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .where('signatures.id', id)
    .first();
};

// ดึงตาม evaluatee_id และ period_id
exports.findByEvaluateeAndPeriod = async (evaluateeId, periodId) => {
  try {
    return await db(TABLE)
      .select('signatures.*', 'users.name_th as evaluator_name')
      .leftJoin('users', 'signatures.evaluator_id', 'users.id')
      .where({
        'signatures.evaluatee_id': evaluateeId,
        'signatures.period_id': periodId
      })
      .orderBy('signatures.signed_at', 'desc');
  } catch (error) {
    // ถ้า column ไม่มี ให้ลอง query แบบไม่มี table prefix
    if (error.message && error.message.includes('Unknown column')) {
      return await db(TABLE)
        .select('signatures.*', 'users.name_th as evaluator_name')
        .leftJoin('users', 'signatures.evaluator_id', 'users.id')
        .where({
          evaluatee_id: evaluateeId,
          period_id: periodId
        })
        .orderBy('signed_at', 'desc');
    }
    throw error;
  }
};

// ดึงตาม evaluator_id
exports.findByEvaluator = async (evaluatorId) => {
  return db(TABLE)
    .select('signatures.*')
    .where({ evaluator_id: evaluatorId })
    .orderBy('signed_at', 'desc');
};

// ตรวจสอบว่ามีลายเซ็นแล้วหรือไม่
exports.exists = async (evaluateeId, periodId, evaluatorId) => {
  const row = await db(TABLE)
    .where({
      evaluatee_id: evaluateeId,
      period_id: periodId,
      evaluator_id: evaluatorId
    })
    .first();
  return !!row;
};

// สร้างใหม่
exports.create = async (payload) => {
  // ตรวจสอบว่ามีลายเซ็นแล้วหรือไม่
  const exists = await exports.exists(payload.evaluatee_id, payload.period_id, payload.evaluator_id);
  if (exists) {
    throw new Error('Signature already exists for this evaluatee, period and evaluator');
  }

  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};