const { GoogleGenAI } = require("@google/genai");

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

module.exports = ai;
