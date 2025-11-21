// backend/controllers/reports.controller.js
// Controller สำหรับจัดการรายงานสรุป (Reports)
const reportsRepo = require('../repositories/reports.repository');

// GET /api/reports/individual/:evaluateeId/:periodId
// สรุปผลการประเมินรายบุคคล
exports.getIndividualSummary = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    
    // เรียกข้อมูลจาก repository
    const data = await reportsRepo.getIndividualSummary(evaluateeId, periodId);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data found for this evaluatee and period' 
      });
    }
    
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

// GET /api/reports/overall/:periodId
// สรุปภาพรวมทั้งหมดในรอบประเมิน
exports.getOverallSummary = async (req, res, next) => {
  try {
    const { periodId } = req.params;
    
    // เรียกข้อมูลรายการทั้งหมด
    const items = await reportsRepo.getOverallSummary(periodId);
    
    res.json({ 
      success: true, 
      items, 
      total: items.length 
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/reports/topics/:periodId
// สรุปคะแนนตามหัวข้อประเมิน
exports.getTopicSummary = async (req, res, next) => {
  try {
    const { periodId } = req.params;
    
    const items = await reportsRepo.getTopicSummary(periodId);
    
    res.json({ 
      success: true, 
      items, 
      total: items.length 
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/reports/export-pdf/:evaluateeId/:periodId
// Export PDF สำหรับรายงานรายบุคคล
// TODO: ใช้ PDFKit หรือ Puppeteer สร้าง PDF จริง
exports.exportPDF = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    
    // ดึงข้อมูลสำหรับ export
    const data = await reportsRepo.getExportData(evaluateeId, periodId);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data found for export' 
      });
    }
    
    // TODO: ในอนาคตจะใช้ PDFKit หรือ Puppeteer สร้าง PDF จริง
    // ตอนนี้ส่งข้อมูล JSON กลับไปก่อน เพื่อให้ Frontend นำไปใช้
    
    // *** ตัวอย่างการสร้าง PDF (ยังไม่ใช้งาน) ***
    // const PDFDocument = require('pdfkit');
    // const doc = new PDFDocument();
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename=report-${evaluateeId}-${periodId}.pdf`);
    // doc.pipe(res);
    // doc.text('รายงานการประเมิน', { align: 'center' });
    // doc.end();
    
    // ส่งข้อมูล JSON ก่อน (ให้ Frontend จัดการ)
    res.json({ 
      success: true, 
      data,
      message: 'Export data ready (PDF generation not implemented yet)' 
    });
  } catch (e) {
    next(e);
  }
};