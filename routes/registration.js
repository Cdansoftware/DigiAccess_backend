const router = require("express").Router();
const Registration = require("../models/Registration");
const { requireAdmin } = require("../middleware/auth");
const { validateRegistration } = require("../services/validation");

// Stops spreadsheet formula injection (=, +, -, @) when the CSV is opened in Excel
const csvCell = (value) => {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// REGISTER A SCHOOL  ->  POST /api/registration            (PUBLIC)
router.post("/", async (req, res, next) => {
  try {
    const { data, errors } = validateRegistration(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const registration = await Registration.create(data);

    return res.status(201).json({
      message: "Registration submitted successfully",
      id: registration.id,
      teamsRegistered: registration.teams.length,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "A registration with this school email already exists" });
    }
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: errors[0], errors });
    }
    next(err);
  }
});

// LIST ALL SCHOOLS  ->  GET /api/registration              (ADMIN ONLY)
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const safe = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [
        { schoolName: rx },
        { roboticsMentorName: rx },
        { englishMentorName: rx },
        { "teams.teamName": rx },
      ];
    }

    const registrations = await Registration.find(filter).sort({ submittedAt: -1 });

    const [agg] = await Registration.aggregate([
      {
        $group: {
          _id: null,
          totalSchools: { $sum: 1 },
          totalTeams: { $sum: { $size: "$teams" } },
        },
      },
    ]);
    const totalSchools = agg ? agg.totalSchools : 0;
    const totalTeams = agg ? agg.totalTeams : 0;

    return res.status(200).json({
      stats: { totalSchools, totalTeams, totalStudents: totalTeams * 2 },
      registrations,
    });
  } catch (err) {
    next(err);
  }
});

// DOWNLOAD CSV  ->  GET /api/registration/export           (ADMIN ONLY)
router.get("/export", requireAdmin, async (req, res, next) => {
  try {
    const registrations = await Registration.find().sort({ submittedAt: 1 });

    const header = [
      "School", "School Email",
      "Robotics Mentor", "Robotics Phone", "Robotics Email",
      "English Mentor", "English Phone", "English Email",
      "Team No", "Team Name",
      "Student 1", "Student 1 Grade", "Student 2", "Student 2 Grade",
      "Submitted At",
    ];
    const rows = [header.map(csvCell).join(",")];

    for (const r of registrations) {
      r.teams.teams?.forEach?.((t, i) => {}) // safe check
      r.teams.forEach((t, i) => {
        rows.push(
          [
            r.schoolName, r.schoolEmail,
            r.roboticsMentorName, r.roboticsMentorPhone, r.roboticsMentorEmail,
            r.englishMentorName, r.englishMentorPhone, r.englishMentorEmail,
            i + 1,
            t.teamName || "",
            t.student1Name, t.student1Grade, t.student2Name, t.student2Grade,
            r.submittedAt.toISOString(),
          ]
            .map(csvCell)
            .join(",")
        );
      });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="registrations.csv"');
    // \uFEFF ensures Excel reads UTF-8 characters properly without symbols distortion
    return res.status(200).send("\uFEFF" + rows.join("\r\n"));
  } catch (err) {
    next(err);
  }
});

// ONE SCHOOL  ->  GET /api/registration/:id                (ADMIN ONLY)
router.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: "Registration not found" });
    return res.status(200).json(registration);
  } catch (err) {
    next(err);
  }
});

// DELETE A SCHOOL  ->  DELETE /api/registration/:id        (ADMIN ONLY)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Registration not found" });
    return res.status(200).json({ message: "Registration deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;