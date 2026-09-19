const prisma = require('../prisma');

function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    if (!Number.isFinite(vectorA[i]) || !Number.isFinite(vectorB[i])) {
      throw new Error('Vectors must contain only finite numbers');
    }
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateJobMatch(candidateProfile, candidateEmbedding, job, jobEmbedding) {
  // 1. Semantic score (40%)
  const hasSemanticData = candidateEmbedding && candidateEmbedding.embedding && jobEmbedding && jobEmbedding.embedding;
  const similarity = hasSemanticData ? cosineSimilarity(candidateEmbedding.embedding, jobEmbedding.embedding) : 0;
  const semanticScore = Math.max(0, similarity) * 100;

  // 2. Skill score (30%)
  const candidateSkills = new Set((candidateProfile.skills || []).map(s => s.toLowerCase()));
  const requiredSkills = (job.skills || []).map(js => js.skill.name.toLowerCase());

  let matchedSkills = [];
  let missingSkills = [];

  if (requiredSkills.length > 0) {
    requiredSkills.forEach(skill => {
      if (candidateSkills.has(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
  }

  const skillScore = requiredSkills.length > 0 
    ? (matchedSkills.length / requiredSkills.length) * 100 
    : 100; // Neutral if no skills required

  // 3. Experience score (15%)
  // Assuming 'experience' in Profile is a number, or needs parsing.
  // Based on CandidateAIProfile, experienceYears is a number.
  const candidateExp = candidateProfile.experienceYears || 0;
  const jobExpStr = job.experience || '0';
  const jobExp = parseInt(jobExpStr, 10) || 0;
  
  const experienceScore = candidateExp >= jobExp ? 100 : Math.max(0, (candidateExp / (jobExp || 1)) * 100);

  // 4. Preference score (10%)
  // Compare location/type/remote
  let preferencePoints = 0;
  // This would typically compare with User profile, but we use candidateProfile here
  // Assuming neutral if data unavailable
  preferencePoints = 100; // Neutral

  const preferenceScore = preferencePoints;

  // 5. Role alignment (5%)
  const targetRoles = (candidateProfile.targetRoles || []).map(r => r.toLowerCase());
  const roleScore = targetRoles.includes(job.title.toLowerCase()) ? 100 : 0;

  // Final score
  let finalScore = 
    semanticScore * 0.40 +
    skillScore * 0.30 +
    experienceScore * 0.15 +
    preferenceScore * 0.10 +
    roleScore * 0.05;

  finalScore = Math.min(100, Math.max(0, finalScore));

  return {
    score: Number(finalScore.toFixed(1)),
    semanticScore: Number(semanticScore.toFixed(1)),
    skillScore: Number(skillScore.toFixed(1)),
    experienceScore: Number(experienceScore.toFixed(1)),
    preferenceScore: Number(preferenceScore.toFixed(1)),
    roleScore: Number(roleScore.toFixed(1)),
    matchedSkills,
    missingSkills,
    explanation: {
      summary: `Match based on semantic relevance, skills, and experience.`,
      strengths: matchedSkills,
      gaps: missingSkills
    }
  };
}

module.exports = { calculateJobMatch };
