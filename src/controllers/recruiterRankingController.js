const prisma = require('../prisma');
const { rankCandidatesForJob } = require('../services/recruiterRankingService');

async function getRankedCandidatesController(req, res) {
  try {
    const jobId = Number(req.params.jobId);
    const recruiterUserId = req.user.userId;

    // Verify job belongs to recruiter
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user.role !== "ADMIN" && job.postedById !== recruiterUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const ranking = await rankCandidatesForJob(jobId, recruiterUserId);
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to rank candidates" });
  }
}

module.exports = { getRankedCandidatesController };
