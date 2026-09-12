const { normalizeSkill } = require('../utils/skillUtils');

function getJobSkillGap(candidateProfile, job) {
  const candidateSkills = new Set((candidateProfile.skills || []).map(normalizeSkill));
  const jobSkills = (job.skills || []).map(js => normalizeSkill(js.skill.name));

  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach(skill => {
    if (candidateSkills.has(skill)) {
      if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
    } else {
      if (!missingSkills.includes(skill)) missingSkills.push(skill);
    }
  });

  const requiredSkillCount = jobSkills.length;
  const matchedSkillCount = matchedSkills.length;
  const coverage = requiredSkillCount > 0 ? (matchedSkillCount / requiredSkillCount) * 100 : 100;

  // Add priority and recommendation (deterministic)
  const missingSkillsWithDetails = missingSkills.map(skill => ({
    name: skill,
    priority: 'medium', // Deterministic default
    recommendation: `${skill} is a key missing skill for this role.`
  }));

  return {
    matchedSkills,
    missingSkills: missingSkillsWithDetails,
    requiredSkillCount,
    matchedSkillCount,
    coverage: parseFloat(coverage.toFixed(1))
  };
}

module.exports = { getJobSkillGap };
