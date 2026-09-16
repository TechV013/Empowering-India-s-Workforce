const ai = require('../ai/aiClient');
const prisma = require('../prisma');

async function generateJobEmbedding(job) {
  if (!job) {
    throw new Error('Job is required for embedding');
  }

  // Ensure skills are mapped to names if they are present as objects
  const skillNames = (job.skills || []).map(js => js.skill ? js.skill.name : '').filter(Boolean).join(', ');

  // 1. Build deterministic text
  const text = [
    'Job Title: ' + job.title,
    'Description: ' + job.description,
    'Skills: ' + skillNames,
    'Experience: ' + (job.experience || 'Not specified'),
    'Job Type: ' + job.jobType,
    'Location: ' + job.location,
    'Remote: ' + (job.isRemote ? 'Yes' : 'No')
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

async function saveJobEmbedding(jobId, embeddingData) {
  return await prisma.job.update({
    where: { id: jobId },
    data: {
      embedding: embeddingData.embedding,
      embeddingModel: embeddingData.model,
      embeddingDimensions: embeddingData.dimensions,
      embeddingUpdatedAt: new Date()
    }
  });
}

module.exports = { generateJobEmbedding, saveJobEmbedding };
