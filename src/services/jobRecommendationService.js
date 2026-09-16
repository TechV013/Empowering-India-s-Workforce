const prisma = require('../prisma');
const { calculateJobMatch } = require('./matchEngineService');

async function getRecommendedJobs(userId, options = {}) {
  const limit = Math.min(parseInt(options.limit || '10', 10), 50);

  // 1. Load user profile + embedding
  const candidate = await prisma.candidateAIProfile.findUnique({
    where: { userId },
  });

  if (!candidate || !candidate.embedding) {
    throw new Error('Candidate profile or embedding not found');
  }

  // 2. Load eligible jobs (excluding already applied)
  const appliedJobs = await prisma.application.findMany({
    where: { userId },
    select: { jobId: true }
  });
  const appliedJobIds = appliedJobs.map(a => a.jobId);

  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        { NOT: { id: { in: appliedJobIds } } },
        { NOT: { embedding: null } }
      ]
    },
    include: {
      skills: { include: { skill: true } }
    }
  });

  // Load skills for candidate to reuse in matching
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true }
  });
  const candidateSkillsNames = userSkills.map(us => us.skill.name);

  // 3. Calculate matches
  const matches = await Promise.all(jobs.map(async (job) => {
    const match = calculateJobMatch(
      { ...candidate, skills: candidateSkillsNames },
      { embedding: candidate.embedding },
      job,
      { embedding: job.embedding }
    );

    // Save match
    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId, jobId: job.id } },
      update: {
        score: match.score,
        semanticScore: match.semanticScore,
        skillScore: match.skillScore,
        experienceScore: match.experienceScore,
        preferenceScore: match.preferenceScore,
        roleScore: match.roleScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        explanation: match.explanation
      },
      create: {
        userId,
        jobId: job.id,
        score: match.score,
        semanticScore: match.semanticScore,
        skillScore: match.skillScore,
        experienceScore: match.experienceScore,
        preferenceScore: match.preferenceScore,
        roleScore: match.roleScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        explanation: match.explanation
      }
    });

    return { ...match, job };
  }));

  // 4. Sort and return
  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { getRecommendedJobs };
