const prisma = require("../prisma");

async function saveJob(req, res) {
  try {
    const userId = req.user.userId;
    const jobId = Number(req.params.jobId);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const saved = await prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId }
    });

    res.status(201).json({
      message: "Job saved",
      saved
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to save job" });
  }
}

async function unsaveJob(req, res) {
  try {
    const userId = req.user.userId;
    const jobId = Number(req.params.jobId);

    await prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } }
    });

    res.json({ message: "Job removed from saved jobs" });
  } catch (error) {
    res.status(404).json({ message: "Saved job not found" });
  }
}

async function getSavedJobs(req, res) {
  const saved = await prisma.savedJob.findMany({
    where: { userId: req.user.userId },
    include: { job: true },
    orderBy: { createdAt: "desc" }
  });

  res.json(saved);
}

module.exports = { saveJob, unsaveJob, getSavedJobs };