const { extractResumeText } = require('./resumeParserService');
const fs = require('fs').promises;

async function runTests() {
  console.log("Running tests...");
  
  // 1. TXT test
  await fs.writeFile('test.txt', 'Hello World\n\n\nThis is a test.');
  const txtResult = await extractResumeText('test.txt', 'text/plain');
  console.log("TXT test passed:", txtResult.text === 'Hello World\n\nThis is a test.');
  
  // 2. Unsupported test
  try {
    await extractResumeText('test.txt', 'application/json');
    console.log("Unsupported test failed: Should have thrown error");
  } catch (e) {
    console.log("Unsupported test passed:", e.message === 'Unsupported file type');
  }
  
  // 3. Empty test
  await fs.writeFile('empty.txt', '   ');
  try {
    await extractResumeText('empty.txt', 'text/plain');
    console.log("Empty test failed: Should have thrown error");
  } catch (e) {
    console.log("Empty test passed:", e.message === 'Empty extracted text');
  }
  
  // Cleanup
  await fs.unlink('test.txt');
  await fs.unlink('empty.txt');
}

runTests().catch(e => { console.error(e); process.exit(1); });
