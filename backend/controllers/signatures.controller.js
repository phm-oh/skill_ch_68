// backend/controllers/signatures.controller.js
// Controller สำหรับจัดการลายเซ็นดิจิทัล
const signaturesRepo = require('../repositories/signatures.repository');

// GET /api/signatures
exports.list = async (req, res, next) => {
  try {
    const items = await signaturesRepo.findAll();
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/signatures/:id
exports.get = async (req, res, next) => {
  try {
    const item = await signaturesRepo.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
};

// GET /api/signatures/result/:resultId
exports.getByResult = async (req, res, next) => {
  try {
    const items = await signaturesRepo.findByResult(req.params.resultId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/signatures/evaluator/:evaluatorId
exports.getByEvaluator = async (req, res, next) => {
  try {
    const items = await signaturesRepo.findByEvaluator(req.params.evaluatorId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/signatures/evaluatee/:evaluateeId/:periodId
exports.getByEvaluateeAndPeriod = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const db = require('../db/knex');

    // Find signature by joining with evaluation_results
    const items = await db('signatures')
      .select('signatures.*', 'users.name_th as evaluator_name')
      .leftJoin('users', 'signatures.evaluator_id', 'users.id')
      .leftJoin('evaluation_results', 'signatures.result_id', 'evaluation_results.id')
      .where({
        'evaluation_results.evaluatee_id': evaluateeId,
        'evaluation_results.period_id': periodId
      })
      .orderBy('signatures.signed_at', 'desc');

    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// POST /api/signatures
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { result_id, evaluatee_id, period_id, signature_data } = req.body;

    // ตรวจ input: ต้องมี signature_data และ (result_id หรือ evaluatee_id+period_id)
    if (!signature_data) {
      return res.status(400).json({ success: false, message: 'signature_data required' });
    }

    // ตรวจสิทธิ์: ต้องเป็น evaluator หรือ admin
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only evaluator or admin can sign' });
    }

    let finalResultId = result_id;

    // ถ้าส่ง evaluatee_id + period_id มา ให้หา result_id แรกของการประเมินนั้น
    if (!finalResultId && evaluatee_id && period_id) {
      const db = require('../db/knex');
      const firstResult = await db('evaluation_results')
        .where({ evaluatee_id, period_id })
        .first();

      if (!firstResult) {
        return res.status(404).json({ success: false, message: 'No evaluation results found' });
      }
      finalResultId = firstResult.id;
    }

    if (!finalResultId) {
      return res.status(400).json({ success: false, message: 'result_id or (evaluatee_id + period_id) required' });
    }

    // สร้าง
    const data = await signaturesRepo.create({
      result_id: finalResultId,
      evaluator_id: userId,
      signature_data
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    if (e.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: e.message });
    }
    next(e);
  }
};

// DELETE /api/signatures/:id
exports.remove = async (req, res, next) => {
  try {
    // ตรวจสิทธิ์: เฉพาะ admin หรือเจ้าของลายเซ็น
    const signature = await signaturesRepo.findById(req.params.id);
    if (!signature) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    if (req.user.role !== 'admin' && req.user.id !== signature.evaluator_id) {
      return res.status(403).json({ success: false, message: 'Cannot delete other evaluator signature' });
    }

    const deleted = await signaturesRepo.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    res.json({ success: true, message: 'Signature deleted' });
  } catch (e) {
    next(e);
  }
};