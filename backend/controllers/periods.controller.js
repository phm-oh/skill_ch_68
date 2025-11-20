// controllers/periods.controller.js
const periodsRepo = require('../repositories/periods.repository');

// GET /api/periods
exports.list = async (req, res, next) => {
  try {
    const items = await periodsRepo.findAll();
    res.json({ success: true, items });
  } catch (e) {
    next(e);
  }
};

// GET /api/periods/:id
exports.get = async (req, res, next) => {
  try {
    const item = await periodsRepo.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
};

// POST /api/periods (admin only)
exports.create = async (req, res, next) => {
  try {
    // ตรวจสิทธิ์
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    // ตรวจ input
    const { code, name_th, buddhist_year, start_date, end_date } = req.body;
    if (!code || !name_th || !buddhist_year || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required: code, name_th, buddhist_year, start_date, end_date' 
      });
    }

    // สร้าง
    const data = await periodsRepo.create({
      code,
      name_th,
      buddhist_year,
      start_date,
      end_date,
      is_active: req.body.is_active !== undefined ? req.body.is_active : 1
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }
    next(e);
  }
};

// PUT /api/periods/:id (admin only)
exports.update = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const existing = await periodsRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }

    const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body;

    // Validate dates when activating period
    if (is_active && (!start_date || !end_date)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุช่วงการประเมิน (วันที่เริ่มต้นและวันที่สิ้นสุด) ก่อนเปิดใช้งาน'
      });
    }

    const data = await periodsRepo.update(req.params.id, {
      code,
      name_th,
      buddhist_year,
      start_date,
      end_date,
      is_active
    });

    res.json({ success: true, data });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }
    next(e);
  }
};

// DELETE /api/periods/:id (admin only)
exports.remove = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const deleted = await periodsRepo.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }

    res.json({ success: true, message: 'Period deleted' });
  } catch (e) {
    next(e);
  }
};

exports.listActive = async (req, res, next) => {
  try {
    const items = await periodsRepo.findActive(); // ต้องเพิ่มใน repository
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};