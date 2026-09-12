const ai = require('../ai/aiClient');
const prisma = require('../prisma');

const PROMPT = `You are a resume analysis system.
Extract the following information from the resume text in JSON format:
- summary (string)
- education (array of objects with degree, institution, year)
- experience (array of objects with title, company, duration, description)
- projects (array of objects with name, description, technologies)
- certifications (array of strings)
- targetRoles (array of strings)
- experienceYears (number)

Rules:
- Return ONLY JSON.
- Do not invent facts not supported by the resume.
`;

async function buildCandidateProfile(userId, resumeText, extractedSkills) {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Empty resume text');
  }

  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
  
  const result = await ai.models.generateContent({
    model: modelName,
    contents: PROMPT + '\n\nResume text:\n' + resumeText,
  });
  
  const text = result.text();
  
  let parsed;
  try {
    const jsonString = text.replace(new RegExp('```json' + '\\' + 'n?', 'g'), '').replace(new RegExp('```' + '\\' + 'n?', 'g'), '').trim();
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON from model for candidate profile');
  }

  // Persist the profile
  const profile = await prisma.candidateAIProfile.upsert({
    where: { userId: userId },
    update: {
      summary: parsed.summary,
      targetRoles: parsed.targetRoles,
      experienceYears: parsed.experienceYears,
      education: parsed.education,
      experience: parsed.experience,
      projects: parsed.projects,
      certifications: parsed.certifications,
    },
    create: {
      userId: userId,
      summary: parsed.summary,
      targetRoles: parsed.targetRoles,
      experienceYears: parsed.experienceYears,
      education: parsed.education,
      experience: parsed.experience,
      projects: parsed.projects,
      certifications: parsed.certifications,
    },
  });

  return {
    ...profile,
    skills: extractedSkills
  };
}

module.exports = { buildCandidateProfile };
