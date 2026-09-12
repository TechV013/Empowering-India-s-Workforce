const SKILL_ALIASES = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ecmascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'react.js': 'React',
  'reactjs': 'React',
  'react': 'React',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'express': 'Express.js',
  'express.js': 'Express.js',
  'expressjs': 'Express.js',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'gha': 'GitHub Actions',
  'github actions': 'GitHub Actions'
};

function normalizeSkill(skillName) {
  const lowerName = skillName.toLowerCase();
  return SKILL_ALIASES[lowerName] || skillName;
}

module.exports = { SKILL_ALIASES, normalizeSkill };
