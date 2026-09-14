const prisma = require('../prisma');
const { extractResumeText } = require('../services/resumeParserService');
const { extractSkills } = require('../services/skillExtractionService');
const { buildCandidateProfile } = require('../services/candidateProfileService');
const { analyzeCandidateProfile } = require('../services/resumeAnalysisService');

async function analyzeResumeController(req, res) {
  try {
    const userId = req.user.userId;
    const resumeId = Number(req.params.resumeId);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({ message: "Invalid resume id" });
    }

    // 1. Load the resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 2. Load the candidate's AI profile
    let candidateProfile = await prisma.candidateAIProfile.findUnique({
      where: { userId }
    });

    let extractedSkills;

    if (!candidateProfile) {
      // 2a. Profile missing: build/update it from the uploaded resume
      //     (same chain the resume-upload pipeline uses: parser -> skills -> profile)
      const { text } = await extractResumeText(resume.filePath, resume.mimeType);
      const { skills } = await extractSkills(text);
      extractedSkills = skills.map(s => s.name);

      candidateProfile = await buildCandidateProfile(userId, text, extractedSkills);
    } else {
      // 2b. Profile exists: use stored normalized skills
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true }
      });
      extractedSkills = userSkills.map(us => us.skill.name);
    }

    // 3. Run analysis via the existing service (persists via ResumeAnalysis.upsert)
    const analysis = await analyzeCandidateProfile(candidateProfile, extractedSkills);

    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to analyze resume" });
  }
}

module.exports = { analyzeResumeController };
