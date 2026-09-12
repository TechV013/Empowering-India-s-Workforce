const prisma = require('../prisma');
const { calculateJobMatch } = require('./matchEngineService');

async function rankCandidatesForJob(jobId, recruiterUserId) {
  // 1. Get Job
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { skills: { include: { skill: true } } }
  });
  if (!job) throw new Error('Job not found');
  
  // 2. Load applications and profile/embedding/skills for candidates
  const applications = await prisma.application.findMany({
    where: { jobId },
    include: { 
      user: {
        include: {
          profile: true,
          skills: { include: { skill: true } }
        }
      }
    }
  });

  const rankedCandidates = [];

  for (const app of applications) {
    const userId = app.userId;
    const profile = await prisma.candidateAIProfile.findUnique({ where: { userId } });
    
    // Skip if no profile or embedding
    if (!profile || !profile.embedding || !job.embedding) continue;

    const candidateSkillsNames = app.user.skills.map(us => us.skill.name);

    // 3. Match
    const match = calculateJobMatch(
      { ...profile, skills: candidateSkillsNames },
      { embedding: profile.embedding },
      job,
      { embedding: job.embedding }
    );

    // 4. Persistence
    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId, jobId } },
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
        jobId,
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

    rankedCandidates.push({
      userId,
      applicationId: app.id,
      ...match,
      applicationStatus: app.status
    });
  }

  return {
    jobId,
    candidates: rankedCandidates.sort((a, b) => b.score - a.score)
  };
}

module.exports = { rankCandidatesForJob };
