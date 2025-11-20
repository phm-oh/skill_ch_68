// repositories/results.repository.js
const db = require('../db/knex');
const TABLE = 'evaluation_results';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE).select('*').orderBy('created_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงผลของบุคคลใน period
exports.findByEvaluateePeriod = async (evaluateeId, periodId) => {
  return db(TABLE)
    .select(
      `${TABLE}.*`,
      'indicators.id as ind_id',
      'indicators.code as ind_code',
      'indicators.name_th as ind_name_th',
      'indicators.type as ind_type',
      'indicators.weight as ind_weight',
      'indicators.topic_id as ind_topic_id',
      'topics.id as topic_id',
      'topics.title_th as topic_title_th',
      'topics.weight as topic_weight',
      'evaluatee.id as evaluatee_id',
      'evaluatee.username as evaluatee_username',
      'evaluatee.name_th as evaluatee_name_th',
      'evaluatee.department_id as evaluatee_dept_id',
      'periods.id as period_id',
      'periods.name_th as period_name_th'
    )
    .leftJoin('indicators', `${TABLE}.indicator_id`, 'indicators.id')
    .leftJoin('evaluation_topics as topics', 'indicators.topic_id', 'topics.id')
    .leftJoin('users as evaluatee', `${TABLE}.evaluatee_id`, 'evaluatee.id')
    .leftJoin('evaluation_periods as periods', `${TABLE}.period_id`, 'periods.id')
    .where({ [`${TABLE}.evaluatee_id`]: evaluateeId, [`${TABLE}.period_id`]: periodId })
    .orderBy('indicators.topic_id', 'asc')
    .orderBy(`${TABLE}.indicator_id`, 'asc')
    .then(rows => {
      // Transform flat rows to nested structure
      return rows.map(row => ({
        id: row.id,
        period_id: row.period_id,
        evaluatee_id: row.evaluatee_id,
        indicator_id: row.indicator_id,
        self_score: row.self_score,
        self_note: row.self_note,
        self_submitted_at: row.self_submitted_at,
        self_selected_value: row.self_selected_value,
        self_comment: row.self_note,
        evaluator_score: row.evaluator_score,
        evaluator_id: row.evaluator_id,
        evaluator_note: row.evaluator_note,
        evaluator_selected_value: row.evaluator_selected_value,
        evaluator_comment: row.evaluator_note,
        evaluated_at: row.evaluated_at,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        indicator: {
          id: row.ind_id,
          code: row.ind_code,
          name_th: row.ind_name_th,
          type: row.ind_type,
          weight: row.ind_weight,
          topic_id: row.ind_topic_id,
          topic: {
            id: row.topic_id,
            title_th: row.topic_title_th,
            weight: row.topic_weight
          }
        },
        evaluatee: {
          id: row.evaluatee_id,
          username: row.evaluatee_username,
          name: row.evaluatee_name_th,
          department: row.evaluatee_dept_id
        },
        period: {
          id: row.period_id,
          name: row.period_name_th
        }
      }));
    });
};

// ตรวจสอบว่ามีแล้วหรือไม่
exports.exists = async (evaluateeId, indicatorId, periodId) => {
  const row = await db(TABLE)
    .where({ evaluatee_id: evaluateeId, indicator_id: indicatorId, period_id: periodId })
    .first();
  return !!row;
};

// สร้างใหม่
exports.create = async (payload) => {
  const exists = await exports.exists(
    payload.evaluatee_id,
    payload.indicator_id,
    payload.period_id
  );
  if (exists) throw new Error('Result already exists');

  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข
exports.update = async (id, payload) => {
  const data = {};
  if (payload.self_score !== undefined) data.self_score = payload.self_score;
  if (payload.evaluator_score !== undefined) data.evaluator_score = payload.evaluator_score;
  if (payload.final_score !== undefined) data.final_score = payload.final_score;

  await db(TABLE).where({ id }).update(data);
  return exports.findById(id);
};

// บันทึกคะแนนตนเอง
exports.saveSelf = async (evaluateeId, indicatorId, periodId, score) => {
  const exists = await exports.exists(evaluateeId, indicatorId, periodId);
  
  if (exists) {
    // อัปเดต
    await db(TABLE)
      .where({ evaluatee_id: evaluateeId, indicator_id: indicatorId, period_id: periodId })
      .update({ self_score: score });
  } else {
    // สร้างใหม่
    await db(TABLE).insert({
      evaluatee_id: evaluateeId,
      indicator_id: indicatorId,
      period_id: periodId,
      self_score: score
    });
  }

  return db(TABLE)
    .where({ evaluatee_id: evaluateeId, indicator_id: indicatorId, period_id: periodId })
    .first();
};

// บันทึกคะแนนจากกรรมการ
exports.saveEvaluator = async (evaluateeId, indicatorId, periodId, score) => {
  const exists = await exports.exists(evaluateeId, indicatorId, periodId);
  
  if (exists) {
    await db(TABLE)
      .where({ evaluatee_id: evaluateeId, indicator_id: indicatorId, period_id: periodId })
      .update({ evaluator_score: score });
  } else {
    await db(TABLE).insert({
      evaluatee_id: evaluateeId,
      indicator_id: indicatorId,
      period_id: periodId,
      evaluator_score: score
    });
  }

  return db(TABLE)
    .where({ evaluatee_id: evaluateeId, indicator_id: indicatorId, period_id: periodId })
    .first();
};

// บันทึกหลายรายการ
exports.saveBulk = async (evaluateeId, periodId, items, scoreType, isSubmitted = false) => {
  for (const item of items) {
    const exists = await exports.exists(evaluateeId, item.indicator_id, periodId);

    let updateData = {};
    let insertData = {
      evaluatee_id: evaluateeId,
      indicator_id: item.indicator_id,
      period_id: periodId
    };

    // Handle different score types with their associated fields
    if (scoreType === 'self_score') {
      updateData = {
        self_selected_value: item.self_selected_value || null,
        self_score: item.self_score,
        self_note: item.self_comment || null
      };
      insertData = {
        ...insertData,
        self_selected_value: item.self_selected_value || null,
        self_score: item.self_score,
        self_note: item.self_comment || null
      };

      // Update status and timestamp if submitted
      if (isSubmitted) {
        updateData.status = 'submitted';
        updateData.self_submitted_at = db.fn.now();
        insertData.status = 'submitted';
        insertData.self_submitted_at = db.fn.now();
      }
    } else if (scoreType === 'evaluator_score') {
      updateData = {
        evaluator_selected_value: item.evaluator_selected_value || null,
        evaluator_score: item.evaluator_score,
        evaluator_note: item.evaluator_note || null
      };
      insertData = {
        ...insertData,
        evaluator_selected_value: item.evaluator_selected_value || null,
        evaluator_score: item.evaluator_score,
        evaluator_note: item.evaluator_note || null
      };
    }

    if (exists) {
      await db(TABLE)
        .where({ evaluatee_id: evaluateeId, indicator_id: item.indicator_id, period_id: periodId })
        .update(updateData);
    } else {
      await db(TABLE).insert(insertData);
    }
  }
  return { saved: items.length };
};

// คำนวณคะแนนรวม
exports.calculateFinal = async (evaluateeId, periodId) => {
  const results = await db(TABLE)
    .select('evaluation_results.*', 'indicators.weight')
    .leftJoin('indicators', 'evaluation_results.indicator_id', 'indicators.id')
    .where({ 'evaluation_results.evaluatee_id': evaluateeId, 'evaluation_results.period_id': periodId });

  let totalWeighted = 0;
  let totalWeight = 0;

  for (const r of results) {
    const score = r.evaluator_score !== null ? r.evaluator_score : r.self_score;
    if (score !== null && r.weight !== null) {
      totalWeighted += score * r.weight;
      totalWeight += r.weight;
    }
  }

  const finalScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;

  return {
    evaluatee_id: evaluateeId,
    period_id: periodId,
    final_score: finalScore,
    total_weight: totalWeight
  };
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// backend/repositories/results.repository.js


// สร้าง evaluation_results ให้ evaluatee ทุกคนในรอบประเมินที่กำหนด
exports.initResultsForPeriod = async (periodId) => {
  // ดึงรายชื่อ evaluatee ทั้งหมด (role = 'evaluatee' หรือ 'user')
  const evaluatees = await db('users')
    .select('id')
    .whereIn('role', ['evaluatee', 'user'])
    .where('is_active', true);

  if (evaluatees.length === 0) {
    return { created: 0, total_evaluatees: 0, total_indicators: 0 };
  }

  // ดึง indicators ที่ active ทั้งหมด
  const indicators = await db('indicators')
    .select('id')
    .where('is_active', true);

  if (indicators.length === 0) {
    return { created: 0, total_evaluatees: evaluatees.length, total_indicators: 0 };
  }

  // สร้าง records ให้ทุกคน
  let createdCount = 0;
  
  for (const evaluatee of evaluatees) {
    for (const indicator of indicators) {
      // เช็คว่ามีอยู่แล้วหรือไม่
      const existing = await db(TABLE)
        .where({
          period_id: periodId,
          evaluatee_id: evaluatee.id,
          indicator_id: indicator.id
        })
        .first();

      if (!existing) {
        await db(TABLE).insert({
          period_id: periodId,
          evaluatee_id: evaluatee.id,
          indicator_id: indicator.id,
          self_score: null,
          self_note: null,
          evaluator_score: null,
          evaluator_id: null,
          evaluator_note: null,
          status: 'draft'
        });
        createdCount++;
      }
    }
  }

  return {
    created: createdCount,
    total_evaluatees: evaluatees.length,
    total_indicators: indicators.length
  };
};

// สร้าง evaluation_results ให้ evaluatee คนเดียวในรอบประเมินที่กำหนด
exports.initResultsForEvaluatee = async (evaluateeId, periodId) => {
  // ดึง indicators ที่ active
  const indicators = await db('indicators')
    .select('id')
    .where('is_active', true);

  if (indicators.length === 0) {
    return { created: 0 };
  }

  let createdCount = 0;

  for (const indicator of indicators) {
    const existing = await db(TABLE)
      .where({
        period_id: periodId,
        evaluatee_id: evaluateeId,
        indicator_id: indicator.id
      })
      .first();

    if (!existing) {
      await db(TABLE).insert({
        period_id: periodId,
        evaluatee_id: evaluateeId,
        indicator_id: indicator.id,
        self_score: null,
        self_note: null,
        evaluator_score: null,
        evaluator_id: null,
        evaluator_note: null,
        status: 'draft'
      });
      createdCount++;
    }
  }

  return { created: createdCount };
};