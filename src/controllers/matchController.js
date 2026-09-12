const prisma = require('../prisma');
const { calculateJobMatch } = require('../services/matchEngineService');

async function getJobMatchController(req, res) {
  try {
    const userId = req.user.userId;
    const jobId = Number(req.params.jobId);

    // 1. Try finding existing match
    let match = await prisma.jobMatch.findUnique({
      where: { userId_jobId: { userId, jobId } }
    });

    // 2. If no existing match, calculate on demand
    if (!match) {
      // A. Load Job + Embedding + Skills
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { skills: { include: { skill: true } } }
      });
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (!job.embedding) return res.status(404).json({ message: "Job embedding unavailable" });

      // B. Load Candidate + Profile + Embedding
      const candidate = await prisma.candidateAIProfile.findUnique({ where: { userId } });
      if (!candidate) return res.status(404).json({ message: "Candidate profile unavailable" });
      if (!candidate.embedding) return res.status(404).json({ message: "Candidate embedding unavailable" });

      // C. Load Skills
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true }
      });
      const candidateSkillsNames = userSkills.map(us => us.skill.name);

      // D. Calculate
      const calculatedMatch = calculateJobMatch(
        { ...candidate, skills: candidateSkillsNames },
        { embedding: candidate.embedding },
        job,
        { embedding: job.embedding }
      );

      // E. Persist
      match = await prisma.jobMatch.upsert({
        where: { userId_jobId: { userId, jobId } },
        update: {
          score: calculatedMatch.score,
          semanticScore: calculatedMatch.semanticScore,
          skillScore: calculatedMatch.skillScore,
          experienceScore: calculatedMatch.experienceScore,
          preferenceScore: calculatedMatch.preferenceScore,
          roleScore: calculatedMatch.roleScore,
          matchedSkills: calculatedMatch.matchedSkills,
          missingSkills: calculatedMatch.missingSkills,
          explanation: calculatedMatch.explanation
        },
        create: {
          userId,
          jobId,
          score: calculatedMatch.score,
          semanticScore: calculatedMatch.semanticScore,
          skillScore: calculatedMatch.skillScore,
          experienceScore: calculatedMatch.experienceScore,
          preferenceScore: calculatedMatch.preferenceScore,
          roleScore: calculatedMatch.roleScore,
          matchedSkills: calculatedMatch.matchedSkills,
          missingSkills: calculatedMatch.missingSkills,
          explanation: calculatedMatch.explanation
        }
      });
    }

    res.json({
      jobId: match.jobId,
      score: match.score,
      semanticScore: match.semanticScore,
      skillScore: match.skillScore,
      experienceScore: match.experienceScore,
      preferenceScore: match.preferenceScore,
      roleScore: match.roleScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      explanation: match.explanation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch match" });
  }
}

module.exports = { getJobMatchController };
