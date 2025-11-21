// backend/routes/signatures.routes.js
// Routes สำหรับจัดการลายเซ็นดิจิทัล
const router = require('express').Router();
const ctrl = require('../controllers/signatures.controller');
const auth = require('../middlewares/auth');

// ทุก route ต้อง login
router.use(auth());

// Routes
router.get('/evaluatee/:evaluateeId/:periodId', ctrl.getByEvaluateeAndPeriod);
router.post('/', ctrl.create);

module.exports = router;