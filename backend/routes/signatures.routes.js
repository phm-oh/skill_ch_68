// backend/routes/signatures.routes.js
// Routes สำหรับจัดการลายเซ็นดิจิทัล
const router = require('express').Router();
const ctrl = require('../controllers/signatures.controller');
const auth = require('../middlewares/auth');

// ทุก route ต้อง login
router.use(auth());

// Routes (เรียงตาม path ที่เฉพาะเจาะจงก่อน)
router.get('/result/:resultId', ctrl.getByResult);
router.get('/evaluatee/:evaluateeId/:periodId', ctrl.getByEvaluateeAndPeriod);
router.get('/evaluator/:evaluatorId', ctrl.getByEvaluator);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;