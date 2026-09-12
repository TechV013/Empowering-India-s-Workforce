const fs = require("fs");
const path = require("path");
const prisma = require("../prisma");
const { extractResumeText } = require("../services/resumeParserService");
const { extractSkills } = require("../services/skillExtractionService");
const { buildCandidateProfile } = require("../services/candidateProfileService");
const { analyzeCandidateProfile } = require("../services/resumeAnalysisService");
const { generateCandidateEmbedding, saveCandidateEmbedding } = require("../services/embeddingService");

async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.user.userId,
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });

    // AI Pipeline (async background execution)
    runAIPipeline(req.user.userId, req.file.path, req.file.mimetype).catch(err => 
      console.error("AI Pipeline failed for user:", req.user.userId, err)
    );

    res.status(201).json({
      message: "Resume uploaded successfully",
      resume
    });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error(error);
    res.status(500).json({ message: "Unable to upload resume" });
  }
}

async function runAIPipeline(userId, filePath, mimeType) {
  // 1. Parser
  const { text: resumeText } = await extractResumeText(filePath, mimeType);
  
  // 2. Skill Extraction
  const { skills: extractedSkills } = await extractSkills(resumeText);
  
  // 3. Profile
  const profile = await buildCandidateProfile(userId, resumeText, extractedSkills.map(s => s.name));
  
  // 4. Analysis
  await analyzeCandidateProfile(profile, extractedSkills.map(s => s.name));
  
  // 5. Embedding
  const embeddingData = await generateCandidateEmbedding(profile);
  await saveCandidateEmbedding(userId, embeddingData);
}

async function getResumes(req, res) {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" }
  });

  res.json(resumes);
}

async function deleteResume(req, res) {
  try {
    const id = Number(req.params.id);

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const fullPath = path.join(
      process.cwd(),
      resume.filePath.replace(/^/+/, "")
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await prisma.resume.delete({ where: { id } });

    res.json({ message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete resume" });
  }
}

module.exports = { uploadResume, getResumes, deleteResume };
