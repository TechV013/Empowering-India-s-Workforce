const prisma = require("../prisma");

async function applyJob(req, res) {
  try {
    const userId = req.user.userId;
    const jobId = Number(req.params.jobId);

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } }
    });

    if (existing) {
      return res.status(409).json({
        message: "You already applied for this job"
      });
    }

    const application = await prisma.application.create({
      data: { userId, jobId },
      include: { job: true }
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to submit application" });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.userId },
      include: { job: true },
      orderBy: { appliedAt: "desc" }
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch applications" });
  }
}

async function updateApplication(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = [
      "APPLIED",
      "REVIEWING",
      "SHORTLISTED",
      "REJECTED",
      "HIRED"
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      application.job.postedById !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Unable to update application" });
  }
}

module.exports = {
  applyJob,
  getMyApplications,
  updateApplication
};