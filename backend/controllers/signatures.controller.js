// backend/controllers/signatures.controller.js
// Controller สำหรับจัดการลายเซ็นดิจิทัล
const signaturesRepo = require('../repositories/signatures.repository');

// GET /api/signatures/evaluatee/:evaluateeId/:periodId
exports.getByEvaluateeAndPeriod = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const items = await signaturesRepo.findByEvaluateeAndPeriod(evaluateeId, periodId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// POST /api/signatures
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { evaluatee_id, period_id, signature_data } = req.body;

    // ตรวจ input: ต้องมี signature_data, evaluatee_id และ period_id
    if (!signature_data) {
      return res.status(400).json({ success: false, message: 'signature_data required' });
    }
    if (!evaluatee_id) {
      return res.status(400).json({ success: false, message: 'evaluatee_id required' });
    }
    if (!period_id) {
      return res.status(400).json({ success: false, message: 'period_id required' });
    }

    // ตรวจสิทธิ์: ต้องเป็น evaluator หรือ admin
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only evaluator or admin can sign' });
    }

    // สร้าง
    const data = await signaturesRepo.create({
      evaluatee_id: parseInt(evaluatee_id),
      period_id: parseInt(period_id),
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
