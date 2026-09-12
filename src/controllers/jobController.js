const prisma = require("../prisma");
const { generateJobEmbedding, saveJobEmbedding } = require("../services/jobEmbeddingService");

async function updateJobEmbedding(jobId) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { skills: { include: { skill: true } } }
    });
    if (!job) return;
    const embeddingData = await generateJobEmbedding(job);
    await saveJobEmbedding(jobId, embeddingData);
  } catch (error) {
    console.error("Failed to generate job embedding for job ID:", jobId, error);
  }
}

async function getJobs(req, res) {
  try {
    const { location, jobType, search, remote } = req.query;

    const where = {};

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
      };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (remote === "true") {
      where.isRemote = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        skills: { include: { skill: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch jobs" });
  }
}

async function getJob(req, res) {
  try {
    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } }
      }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch job" });
  }
}

async function createJob(req, res) {
  try {
    const {
      title,
      company,
      description,
      location,
      jobType,
      salary,
      experience,
      isRemote = false
    } = req.body;

    if (!title || !company || !description || !location || !jobType) {
      return res.status(400).json({
        message: "title, company, description, location and jobType are required"
      });
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        description,
        location,
        jobType,
        salary,
        experience,
        isRemote: Boolean(isRemote),
        postedById: req.user.userId
      }
    });

    // Run embedding asynchronously
    updateJobEmbedding(job.id);

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to create job" });
  }
}

async function updateJob(req, res) {
  try {
    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user.role !== "ADMIN" && job.postedById !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: req.body
    });

    // Run embedding asynchronously on update
    updateJobEmbedding(id);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update job" });
  }
}

async function deleteJob(req, res) {
  try {
    const id = Number(req.params.id);
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user.role !== "ADMIN" && job.postedById !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.job.delete({ where: { id } });

    res.json({ message: "Job deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete job" });
  }
}

module.exports = { getJobs, getJob, createJob, updateJob, deleteJob };
