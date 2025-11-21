// backend/routes/results.routes.js
// ⚠️ ส่วนเพิ่มเติม: เพิ่ม 2 routes ใหม่ที่ท้ายไฟล์

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/results.controller');
const requireAuth = require('../middlewares/requireAuth');

// ============= Routes เดิม =============
router.get('/me/:periodId', requireAuth, ctrl.getMyResults);
router.get('/evaluatee/:evaluateeId/:periodId', requireAuth, ctrl.getByEvaluatee);
router.get('/summary/:evaluateeId/:periodId', requireAuth, ctrl.getSummary);
router.post('/self/bulk', requireAuth, ctrl.saveSelfBulk);
router.post('/self', requireAuth, ctrl.saveSelf);
router.post('/evaluate/bulk', requireAuth, ctrl.evaluateBulk);
router.post('/evaluate', requireAuth, ctrl.evaluate);
router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.get);
router.delete('/:id', requireAuth, ctrl.remove);

// ============= ⚠️ ส่วนเพิ่มเติม: Auto-Create Routes =============
router.post('/init-for-period', requireAuth, ctrl.initResultsForPeriod); // Admin สร้างให้ทุกคน
router.post('/init-for-me', requireAuth, ctrl.initResultsForMe);         // Evaluatee สร้างให้ตัวเอง

module.exports = router;