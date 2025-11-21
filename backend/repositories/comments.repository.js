// backend/repositories/comments.repository.js
// Repository สำหรับจัดการความคิดเห็นกรรมการ
const db = require('../db/knex');
const TABLE = 'comments';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE)
    .select(
      'comments.*',
      'evaluator.name_th as evaluator_name',
      'evaluatee.name_th as evaluatee_name',
      'periods.name_th as period_name'
    )
    .leftJoin('users as evaluator', 'comments.evaluator_id', 'evaluator.id')
    .leftJoin('users as evaluatee', 'comments.evaluatee_id', 'evaluatee.id')
    .leftJoin('periods', 'comments.period_id', 'periods.id')
    .orderBy('comments.created_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE)
    .select(
      'comments.*',
      'evaluator.name_th as evaluator_name',
      'evaluatee.name_th as evaluatee_name',
      'periods.name_th as period_name'
    )
    .leftJoin('users as evaluator', 'comments.evaluator_id', 'evaluator.id')
    .leftJoin('users as evaluatee', 'comments.evaluatee_id', 'evaluatee.id')
    .leftJoin('periods', 'comments.period_id', 'periods.id')
    .where('comments.id', id)
    .first();
};

// ดึงตาม period_id และ evaluatee_id
exports.findByEvaluateeAndPeriod = async (evaluateeId, periodId) => {
  return db(TABLE)
    .select(
      'comments.*',
      'evaluator.name_th as evaluator_name'
    )
    .leftJoin('users as evaluator', 'comments.evaluator_id', 'evaluator.id')
    .where({
      'comments.evaluatee_id': evaluateeId,
      'comments.period_id': periodId
    })
    .orderBy('comments.created_at', 'desc');
};

// ดึงตาม evaluator_id
exports.findByEvaluator = async (evaluatorId) => {
  return db(TABLE)
    .select(
      'comments.*',
      'evaluatee.name_th as evaluatee_name',
      'periods.name_th as period_name'
    )
    .leftJoin('users as evaluatee', 'comments.evaluatee_id', 'evaluatee.id')
    .leftJoin('periods', 'comments.period_id', 'periods.id')
    .where('comments.evaluator_id', evaluatorId)
    .orderBy('comments.created_at', 'desc');
};

// ดึงตาม period_id
exports.findByPeriod = async (periodId) => {
  return db(TABLE)
    .select(
      'comments.*',
      'evaluator.name_th as evaluator_name',
      'evaluatee.name_th as evaluatee_name'
    )
    .leftJoin('users as evaluator', 'comments.evaluator_id', 'evaluator.id')
    .leftJoin('users as evaluatee', 'comments.evaluatee_id', 'evaluatee.id')
    .where('comments.period_id', periodId)
    .orderBy('comments.created_at', 'desc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข
exports.update = async (id, payload) => {
  const data = {};
  if (payload.comment_text !== undefined) data.comment_text = payload.comment_text;
  if (payload.comment_type !== undefined) data.comment_type = payload.comment_type;

  await db(TABLE).where({ id }).update(data);
  return exports.findById(id);
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};