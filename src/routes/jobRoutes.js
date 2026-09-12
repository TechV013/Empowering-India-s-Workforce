const express = require("express");
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");
const {
  authenticate,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJob);

router.post(
  "/",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  createJob
);

router.put(
  "/:id",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  updateJob
);

router.delete(
  "/:id",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  deleteJob
);

module.exports = router;