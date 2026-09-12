const express = require("express");
const {
  applyJob,
  getMyApplications,
  updateApplication
} = require("../controllers/applicationController");
const {
  authenticate,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", authenticate, getMyApplications);
router.post("/:jobId", authenticate, applyJob);

router.patch(
  "/:id",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  updateApplication
);

module.exports = router;