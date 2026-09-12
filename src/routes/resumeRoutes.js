const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadResume,
  getResumes,
  deleteResume
} = require("../controllers/resumeController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName =
      path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);

    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
  storage,
  limits: {
    fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    }
    cb(null, true);
  }
});

router.post(
  "/",
  authenticate,
  upload.single("resume"),
  uploadResume
);

router.get("/", authenticate, getResumes);
router.delete("/:id", authenticate, deleteResume);

module.exports = router;