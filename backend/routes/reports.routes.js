// backend/routes/reports.routes.js
// Routes สำหรับ API รายงานสรุป (Reports)
const router = require('express').Router();
const ctrl = require('../controllers/reports.controller');
const auth = require('../middlewares/auth');

// ใช้ auth middleware สำหรับทุก route ในไฟล์นี้
router.use(auth());

// GET /api/reports/individual/:evaluateeId/:periodId
// สรุปผลการประเมินรายบุคคล
router.get('/individual/:evaluateeId/:periodId', ctrl.getIndividualSummary);

// GET /api/reports/overall/:periodId
// สรุปภาพรวมทั้งหมดในรอบประเมิน
router.get('/overall/:periodId', ctrl.getOverallSummary);

// GET /api/reports/topics/:periodId
// สรุปคะแนนตามหัวข้อประเมิน
router.get('/topics/:periodId', ctrl.getTopicSummary);

// GET /api/reports/export-pdf/:evaluateeId/:periodId
// Export PDF สำหรับรายงานรายบุคคล
router.get('/export-pdf/:evaluateeId/:periodId', ctrl.exportPDF);

module.exports = router;