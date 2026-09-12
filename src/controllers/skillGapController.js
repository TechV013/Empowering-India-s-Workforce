const prisma = require('../prisma');
const { getJobSkillGap } = require('../services/skillGapService');

async function getJobSkillGapController(req, res) {
  try {
    const userId = req.user.userId;
    const jobId = Number(req.params.jobId);

    const candidate = await prisma.candidateAIProfile.findUnique({
      where: { userId },
    });
    
    // Resume already has normalized skills in Step1-2, but we need them linked
    // Based on previous steps, let's fetch user skills directly
    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true }
    });
    const candidateSkillsNames = userSkills.map(us => us.skill.name);
    
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        skills: { include: { skill: true } }
      }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const gap = getJobSkillGap({ ...candidate, skills: candidateSkillsNames }, job);
    res.json(gap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to calculate skill gaps" });
  }
}

module.exports = { getJobSkillGapController };
