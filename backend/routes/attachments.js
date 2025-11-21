// backend/routes/attachments.js
// ⭐ แก้ไข: ลบ route /indicators ออก เพราะชนกับ indicators.routes.js

const express = require("express");
const router = express.Router();
const db = require("../db/knex");
const asgRepo = require("../repositories/assignments.repository");
const authz = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// GET /api/periods/active
router.get(
  "/periods/active",
  authz("evaluatee", "evaluator", "admin"),
  async (req, res) => {
    const rows = await db("periods")
      .where({ is_active: 1 })
      .orderBy("id", "desc");
    res.json(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name_th: r.name_th || r.name || r.title,
      }))
    );
  }
);

//  ลบ route นี้ออก เพราะชนกับ /api/indicators ใน indicators.routes.js
// GET /api/indicators?period_id=..
// router.get(
//   "/indicators",
//   authz("evaluatee", "evaluator", "admin"),
//   async (req, res) => {
//     const { period_id } = req.query;
//     let q = db("indicators").where({ active: 1 });
//     res.json(await q.select("id", "code", "name_th", "type"));
//   }
// );

// GET /api/indicators/:id/evidence-types
router.get(
  "/indicators/:id/evidence-types",
  authz("evaluatee", "evaluator", "admin"),
  async (req, res) => {
    const id = req.params.id;
    const rows = await db("indicator_evidence as ie")
      .join("evidence_types as et", "et.id", "ie.evidence_type_id")
      .where("ie.indicator_id", id)
      .select("et.id", "et.name_th");
    
    const mapped = rows.map((r) => ({
      id: r.id,
      name_th: r.name_th,
      mime_list: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
      max_mb: 10,
    }));
    res.json(mapped);
  }
);

// POST /api/attachments
router.post(
  "/attachments",
  authz("evaluatee", "evaluator"),
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        period_id,
        indicator_id,
        evidence_type_id,
        note,
        evaluatee_id: bodyEvaluatee,
      } = req.body;
      
      if (!period_id || !indicator_id || !evidence_type_id || !req.file) {
        return res.status(422).json({ message: "Missing required fields" });
      }

      // 1) period active
      const per = await db("periods")
        .where({ id: period_id, is_active: 1 })
        .first();
      if (!per) return res.status(404).json({ message: "Period not active" });

      // 2) indicator exists
      const ind = await db("indicators")
        .where({ id: indicator_id, active: 1 })
        .first();
      if (!ind) return res.status(404).json({ message: "Indicator not found" });

      // 3) indicator ↔ evidence allowed
      const allowed = await db("indicator_evidence")
        .where({ indicator_id, evidence_type_id })
        .first();
      if (!allowed)
        return res
          .status(409)
          .json({ message: "Evidence type not allowed for this indicator" });

      // 4) resolve evaluatee + check rights
      const { id: userId, role } = req.user;
      let evaluatee_id;
      if (role === "evaluatee") {
        evaluatee_id = userId;
        const ok = await asgRepo.hasEvaluateeInPeriod({
          period_id,
          evaluatee_id,
        });
        if (!ok)
          return res
            .status(403)
            .json({ message: "You are not in this period" });
      } else if (role === "evaluator") {
        evaluatee_id = Number(bodyEvaluatee);
        if (!evaluatee_id)
          return res
            .status(422)
            .json({ message: "evaluatee_id required for evaluator" });
        const ok = await asgRepo.hasPairInPeriod({
          period_id,
          evaluatee_id,
          evaluator_id: userId,
        });
        if (!ok)
          return res
            .status(403)
            .json({ message: "Not your evaluatee" });
      } else {
        return res.status(403).json({ message: "Invalid role" });
      }

      // 5) insert attachment
      const [id] = await db("attachments").insert({
        evaluatee_id,
        period_id,
        indicator_id,
        evidence_type_id,
        storage_path: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        note: note || null,
      });

      const created = await db("attachments").where({ id }).first();
      res.status(201).json({
        success: true,
        data: { ...created, url: `/uploads/${created.storage_path}` },
      });
    } catch (e) {
      console.error("Upload error:", e);
      res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;