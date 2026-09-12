const express = require("express");
const {
  saveJob,
  unsaveJob,
  getSavedJobs
} = require("../controllers/savedJobController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, getSavedJobs);
router.post("/:jobId", authenticate, saveJob);
router.delete("/:jobId", authenticate, unsaveJob);

module.exports = router;