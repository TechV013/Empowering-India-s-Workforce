const ai = require('../ai/aiClient');
const prisma = require('../prisma');
const { extractJson } = require('../utils/jsonParser');

const PROMPT = `You are an expert resume analyst. Analyze the provided candidate profile data and provide:
- score: 0-100 based on relevance, structure, experience quality, and impact.
- strengths: array of strings.
- weaknesses: array of strings.
- skillGaps: array of strings (general employability gaps for the target roles).
- suggestions: array of strings.

Rules:
- Return ONLY JSON.
- Score ranges: 90-100 (excellent), 80-89 (strong), 70-79 (good), 60-69 (needs improvement), <60 (weak).
- Be objective and ground all assessments in the provided profile data.
- Do not invent experience or skills.
`;

async function analyzeCandidateProfile(candidateProfile, extractedSkills) {
  if (!candidateProfile) {
    throw new Error('Candidate profile is required for analysis');
  }

  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
  
  const contentToAnalyze = JSON.stringify({
    ...candidateProfile,
    skills: extractedSkills
  });

  const result = await ai.models.generateContent({
    model: modelName,
    contents: PROMPT + '\n\nCandidate Profile JSON:\n' + contentToAnalyze,
  });
  
  const text = result.text;
  
  let parsed;
  try {
    parsed = extractJson(text);
  } catch (e) {
    throw new Error('Invalid JSON from model for resume analysis');
  }

  // Validate score
  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));

  // Persist the analysis
  const analysis = await prisma.resumeAnalysis.upsert({
    where: { userId: candidateProfile.userId },
    update: {
      score: score,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      skillGaps: parsed.skillGaps,
      suggestions: parsed.suggestions,
    },
    create: {
      userId: candidateProfile.userId,
      score: score,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      skillGaps: parsed.skillGaps,
      suggestions: parsed.suggestions,
    },
  });

  return analysis;
}

module.exports = { analyzeCandidateProfile };