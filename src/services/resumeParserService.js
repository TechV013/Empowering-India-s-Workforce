const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');


function resolveResumePath(filePath) {
  if (!filePath) return undefined;
  const candidate = String(filePath).trim();

  // Windows absolute path (e.g. multer output: C:\repo\uploads\x.pdf)
  if (/^[a-zA-Z]:[\\/]/.test(candidate)) {
    return path.normalize(candidate);
  }

  // POSIX absolute path (e.g. multer on Linux/Vercel: /tmp/... or /var/task/...)
  if (candidate.startsWith('/')) {
    // Web-style storage path (/uploads/<name>) -> resolve against the uploads root
    if (candidate.startsWith('/uploads/')) {
      return path.join(process.cwd(), candidate.replace(/^\/+/, ''));
    }
    return path.normalize(candidate);
  }

  // Everything else resolves against the process working directory
  return path.resolve(process.cwd(), candidate);
}

async function extractResumeText(filePath, mimeType) {
  // 1. Read the file
  const fullPath = resolveResumePath(filePath);
  
  let buffer;
  try {
    buffer = await fs.readFile(fullPath);
  } catch (error) {
    // Vercel deployment: files written by multer live in /tmp. If the stored
    // web-style path (/uploads/<name>) doesn't resolve locally, try /tmp.
    if (error.code === 'ENOENT' && String(filePath).startsWith('/uploads/')) {
      const tmpFallback = path.join('/tmp', 'uploads', path.basename(filePath));
      try {
        buffer = await fs.readFile(tmpFallback);
      } catch (tmpError) {
        throw new Error('File not found');
      }
    } else if (error.code === 'ENOENT') {
      throw new Error('File not found');
    } else {
      throw new Error('Could not read file');
    }
  }

  // 2. Extract text based on MIME type
  let text = '';
  
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimeType === 'text/plain') {
      text = buffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    if (error.message === 'Unsupported file type') throw error;
    throw new Error('Invalid or corrupt document');
  }

  // 3. Normalize whitespace
  if (!text || text.trim().length === 0) {
    throw new Error('Empty extracted text');
  }

  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove multiple blank lines
    .trim();

  return {
    text: normalizedText,
    mimeType
  };
}

module.exports = { extractResumeText };