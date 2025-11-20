// controllers/results.controller.js
const repo = require('../repositories/results.repository');

// GET /api/results
exports.list = async (req, res, next) => {
  try {
    const items = await repo.findAll();
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/:id
exports.get = async (req, res, next) => {
  try {
    const item = await repo.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/me/:periodId
exports.getMyResults = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const items = await repo.findByEvaluateePeriod(userId, req.params.periodId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/evaluatee/:evaluateeId/:periodId
exports.getByEvaluatee = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const items = await repo.findByEvaluateePeriod(evaluateeId, periodId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/self
exports.saveSelf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { indicator_id, period_id, score } = req.body;
    if (!indicator_id) return res.status(400).json({ success: false, message: 'indicator_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (score === undefined) return res.status(400).json({ success: false, message: 'score required' });

    const result = await repo.saveSelf(userId, indicator_id, period_id, score);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/self/bulk
exports.saveSelfBulk = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period_id, items, is_submitted } = req.body;
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

    const result = await repo.saveBulk(userId, period_id, items, 'self_score', is_submitted);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/evaluate
exports.evaluate = async (req, res, next) => {
  try {
    const { evaluatee_id, indicator_id, period_id, score } = req.body;
    if (!evaluatee_id) return res.status(400).json({ success: false, message: 'evaluatee_id required' });
    if (!indicator_id) return res.status(400).json({ success: false, message: 'indicator_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (score === undefined) return res.status(400).json({ success: false, message: 'score required' });

    const result = await repo.saveEvaluator(evaluatee_id, indicator_id, period_id, score);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/evaluate/bulk
exports.evaluateBulk = async (req, res, next) => {
  try {
    const { evaluatee_id, period_id, items } = req.body;
    if (!evaluatee_id) return res.status(400).json({ success: false, message: 'evaluatee_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

    const result = await repo.saveBulk(evaluatee_id, period_id, items, 'evaluator_score');
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/summary/:evaluateeId/:periodId
exports.getSummary = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const summary = await repo.calculateFinal(evaluateeId, periodId);
    res.json({ success: true, data: summary });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/results/:id
exports.remove = async (req, res, next) => {
  try {
    const deleted = await repo.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
};


// POST /api/results/self - ประเมินตนเอง
exports.submitSelf = async (req, res, next) => {
  try {
    const evaluateeId = req.user.id; // จาก JWT
    const { period_id, indicator_id, self_score, self_note } = req.body;
    
    // Validation
    if (!period_id || !indicator_id || self_score === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'period_id, indicator_id, self_score required' 
      });
    }
    
    // Check if exists
    const existing = await db('evaluation_results')
      .where({ period_id, evaluatee_id: evaluateeId, indicator_id })
      .first();
    
    if (existing) {
      // Update
      await db('evaluation_results')
        .where({ id: existing.id })
        .update({
          self_score,
          self_note: self_note || null,
          self_submitted_at: db.fn.now(),
          status: 'submitted'
        });
    } else {
      // Insert
      await db('evaluation_results').insert({
        period_id,
        evaluatee_id: evaluateeId,
        indicator_id,
        self_score,
        self_note: self_note || null,
        self_submitted_at: db.fn.now(),
        status: 'submitted'
      });
    }
    
    const result = await db('evaluation_results')
      .where({ period_id, evaluatee_id: evaluateeId, indicator_id })
      .first();
    
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/evaluate - กรรมการให้คะแนน
exports.submitEvaluate = async (req, res, next) => {
  try {
    const evaluatorId = req.user.id;
    const { result_id, evaluator_score, evaluator_note } = req.body;
    
    if (!result_id || evaluator_score === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'result_id, evaluator_score required' 
      });
    }
    
    // Check authorization (ต้องเป็นกรรมการที่ได้รับมอบหมาย)
    const result = await db('evaluation_results').where({ id: result_id }).first();
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    
    const assignment = await db('assignments')
      .where({
        period_id: result.period_id,
        evaluatee_id: result.evaluatee_id,
        evaluator_id: evaluatorId
      })
      .first();
    
    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to evaluate this person' 
      });
    }
    
    // Update
    await db('evaluation_results')
      .where({ id: result_id })
      .update({
        evaluator_id: evaluatorId,
        evaluator_score,
        evaluator_note: evaluator_note || null,
        evaluated_at: db.fn.now(),
        status: 'evaluated'
      });
    
    const updated = await db('evaluation_results').where({ id: result_id }).first();
    
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/my-progress - ดูความคืบหน้าตัวเอง
exports.getMyProgress = async (req, res, next) => {
  try {
    const evaluateeId = req.user.id;
    const { period_id } = req.query;
    
    if (!period_id) {
      return res.status(400).json({ success: false, message: 'period_id required' });
    }
    
    const results = await db('evaluation_results as er')
      .select(
        'er.*',
        'i.name_th as indicator_name',
        'i.type as indicator_type',
        't.title_th as topic_name'
      )
      .leftJoin('indicators as i', 'er.indicator_id', 'i.id')
      .leftJoin('evaluation_topics as t', 'i.topic_id', 't.id')
      .where('er.evaluatee_id', evaluateeId)
      .where('er.period_id', period_id)
      .orderBy('t.id', 'asc')
      .orderBy('i.id', 'asc');
    
    res.json({ success: true, items: results, total: results.length });
  } catch (e) {
    next(e);
  }
};

// backend/controllers/results.controller.js
// ============= ⚠️ ส่วนเพิ่มเติม: Auto-Create Results (ใช้ Repository) =============



// POST /api/results/init-for-period
// สร้าง evaluation_results ให้ evaluatee ทุกคนในรอบประเมินที่กำหนด
exports.initResultsForPeriod = async (req, res, next) => {
  try {
    const { period_id } = req.body;
    
    if (!period_id) {
      return res.status(400).json({ success: false, message: 'period_id required' });
    }

    const result = await repo.initResultsForPeriod(period_id);

    res.json({ 
      success: true, 
      message: `Created ${result.created} evaluation records`,
      data: result
    });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/init-for-me
// สร้าง evaluation_results ให้ตัวเองในรอบประเมินที่ active
exports.initResultsForMe = async (req, res, next) => {
  try {
    const evaluateeId = req.user.id;
    const { period_id } = req.body;

    if (!period_id) {
      return res.status(400).json({ success: false, message: 'period_id required' });
    }

    const result = await repo.initResultsForEvaluatee(evaluateeId, period_id);

    res.json({
      success: true,
      message: `Created ${result.created} records`,
      data: result
    });
  } catch (e) {
    next(e);
  }
};
