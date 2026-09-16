const ai = require('../ai/aiClient');
const prisma = require('../prisma');

async function generateCandidateEmbedding(candidateProfile) {
  if (!candidateProfile) {
    throw new Error('Candidate profile is required for embedding');
  }

  // 1. Build deterministic text
  const text = [
    'Target Roles: ' + (candidateProfile.targetRoles || []).join(', '),
    'Skills: ' + (candidateProfile.skills || []).join(', '),
    'Experience Years: ' + candidateProfile.experienceYears,
    'Summary: ' + candidateProfile.summary,
    'Education: ' + JSON.stringify(candidateProfile.education),
    'Experience: ' + JSON.stringify(candidateProfile.experience),
    'Projects: ' + JSON.stringify(candidateProfile.projects),
    'Certifications: ' + (candidateProfile.certifications || []).join(', ')
  ].join('\n\n');

  // 2. Call Gemini embedding API
  const model = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
  const dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '768', 10);

  const result = await ai.models.embedContent({
    model: model,
    content: text,
    config: {
      outputDimensionality: dimensions
    }
  });

  const embedding = result.embedding?.values ?? result.embeddings?.[0]?.values;

  // 3. Validation
  if (!Array.isArray(embedding) || embedding.length !== dimensions || !embedding.every(v => Number.isFinite(v))) {
    throw new Error('Invalid embedding vector returned');
  }

  return {
    embedding,
    model,
    dimensions
  };
}

async function saveCandidateEmbedding(userId, embeddingData) {
  return await prisma.candidateAIProfile.upsert({
    where: { userId: userId },
    update: {
      embedding: embeddingData.embedding,
      embeddingModel: embeddingData.model,
      embeddingDimensions: embeddingData.dimensions,
      embeddingUpdatedAt: new Date()
    },
    create: {
      userId: userId,
      embedding: embeddingData.embedding,
      embeddingModel: embeddingData.model,
      embeddingDimensions: embeddingData.dimensions,
      embeddingUpdatedAt: new Date()
    }
  });
}

module.exports = { generateCandidateEmbedding, saveCandidateEmbedding };
