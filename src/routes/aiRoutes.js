const express = require("express");
const { getRecommendedJobsController } = require("../controllers/aiController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
const { getJobSkillGapController } = require("../controllers/skillGapController");
const { getRankedCandidatesController } = require("../controllers/recruiterRankingController");
const { getJobMatchController } = require("../controllers/matchController");
const { analyzeResumeController } = require("../controllers/resumeAnalysisController");

router.get("/jobs/recommended", authenticate, getRecommendedJobsController);

router.get("/jobs/:jobId/skill-gaps", authenticate, getJobSkillGapController);

router.get("/recruiter/jobs/:jobId/candidates", authenticate, getRankedCandidatesController);

router.get("/jobs/:jobId/match", authenticate, getJobMatchController);

router.post("/resumes/:resumeId/analyze", authenticate, analyzeResumeController);

module.exports = router;