const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractResumeText(filePath, mimeType) {
  // 1. Read the file
  // Replacing leading forward slashes or backslashes
  const fullPath = path.join(process.cwd(), filePath.replace(/^[\\/]+/, ""));
  
  let buffer;
  try {
    buffer = await fs.readFile(fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    }
    throw new Error('Could not read file');
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
