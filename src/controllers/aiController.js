const { getRecommendedJobs } = require("../services/jobRecommendationService");

async function getRecommendedJobsController(req, res) {
  try {
    const userId = req.user.userId;
    const { limit } = req.query;

    const recommendations = await getRecommendedJobs(userId, { limit });
    res.json(recommendations);
  } catch (error) {
    if (error.message === "Candidate profile or embedding not found") {
      return res.status(404).json({
        message: "No AI profile found. Please upload your resume first to enable recommendations."
      });
    }
    console.error(error);
    res.status(500).json({ message: "Unable to fetch recommendations" });
  }
}

module.exports = { getRecommendedJobsController };
