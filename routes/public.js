const router = require("express").Router();
const Registration = require("../models/Registration");

// PUBLIC PARTICIPANTS LIST  ->  GET /api/public/participants   (NO AUTH, READ ONLY)
router.get("/participants", async (req, res, next) => {
  try {
    const registrations = await Registration.find(
      {},
      {
        schoolName: 1,
        roboticsMentorName: 1,
        englishMentorName: 1,
        "teams.teamName": 1,
        submittedAt: 1,
      }
    )
      .sort({ submittedAt: -1 })
      .lean();

    const schools = registrations.map((r) => {
      const teams = (r.teams || []).map((t) => t.teamName || "");
      return {
        id: r._id,
        schoolName: r.schoolName,
        roboticsMentorName: r.roboticsMentorName,
        englishMentorName: r.englishMentorName,
        teamCount: teams.length,
        teams,
        submittedAt: r.submittedAt,
      };
    });

    const totalTeams = schools.reduce((sum, s) => sum + s.teamCount, 0);

    res.set("Cache-Control", "public, max-age=60");
    return res.status(200).json({
      stats: { totalSchools: schools.length, totalTeams },
      schools,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;