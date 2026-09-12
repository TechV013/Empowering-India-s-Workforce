const ai = require('../ai/aiClient');

const { normalizeSkill } = require('../utils/skillUtils');

const PROMPT = 'You are a resume skill extraction system. Extract only technical skills explicitly supported by the resume. Return JSON ONLY. The response should be a JSON object with a single "skills" array. For every skill provide name, category, and evidence. Categories allowed: frontend, backend, database, devops, cloud, ai_ml, mobile, language, testing, tools, other. Rules: Never invent skills. Do not infer a technology solely from a job title. Do not treat ordinary words as skills. A skill must have evidence in the supplied resume. Return only JSON.';

async function extractSkills(resumeText) {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Empty resume text');
  }

  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
  
  // The new @google/genai SDK uses ai.models.generateContent
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
    throw new Error('Invalid JSON from model');
  }

  if (!parsed.skills || !Array.isArray(parsed.skills)) {
    throw new Error('Missing skills field in model response');
  }

  const normalizedSkillsMap = new Map();
  
  for (const skill of parsed.skills) {
    if (!skill.name || !skill.category) continue;
    
    const lowerName = skill.name.toLowerCase();
    const canonicalName = normalizeSkill(skill.name);
    
    if (!normalizedSkillsMap.has(canonicalName)) {
      normalizedSkillsMap.set(canonicalName, {
        name: canonicalName,
        category: skill.category.toLowerCase(),
        evidence: skill.evidence
      });
    }
  }

  return {
    skills: Array.from(normalizedSkillsMap.values())
  };
}

module.exports = { extractSkills };