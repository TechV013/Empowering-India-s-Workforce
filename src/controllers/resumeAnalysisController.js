const path = require('path');
const prisma = require('../prisma');
const { extractResumeText } = require('../services/resumeParserService');
const { extractSkills } = require('../services/skillExtractionService');
const { buildCandidateProfile } = require('../services/candidateProfileService');
const { analyzeCandidateProfile } = require('../services/resumeAnalysisService');

function resolveFilePath(storedPath) {
  if (!storedPath) return storedPath;
  const s = String(storedPath).trim();
  if (/^[a-zA-Z]:[\\/]/.test(s)) return path.normalize(s);
  if (s.startsWith('/')) {
    if (s.startsWith('/uploads/')) {
      if (process.env.VERCEL) return path.join('/tmp', s.replace(/^\/+/, ''));
      return path.join(process.cwd(), s.replace(/^\/+/, ''));
    }
    return path.normalize(s);
  }
  return path.resolve(process.cwd(), s);
}

async function analyzeResumeController(req, res) {
  try {
    const userId = req.user.userId;
    const resumeId = Number(req.params.resumeId);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({ message: "Invalid resume id" });
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });

    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.userId !== userId) return res.status(403).json({ message: "Not allowed" });

    let candidateProfile = await prisma.candidateAIProfile.findUnique({ where: { userId } });
    let extractedSkills;

    if (!candidateProfile) {
      const resolvedPath = resolveFilePath(resume.filePath);
      const { text } = await extractResumeText(resolvedPath, resume.mimeType);
      const { skills } = await extractSkills(text);
      extractedSkills = skills.map(s => s.name);
      candidateProfile = await buildCandidateProfile(userId, text, extractedSkills);
    } else {
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true }
      });
      extractedSkills = userSkills.map(us => us.skill.name);
    }

    const analysis = await analyzeCandidateProfile(candidateProfile, extractedSkills);
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to analyze resume" });
  }
}

async function getResumeAnalysisController(req, res) {
  try {
    const userId = req.user.userId;

    const analysis = await prisma.resumeAnalysis.findUnique({ where: { userId } });

    if (!analysis) {
      return res.status(404).json({ message: "No analysis found. Please run an analysis first." });
    }

    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch analysis" });
  }
}

module.exports = { analyzeResumeController, getResumeAnalysisController };
