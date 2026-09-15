// Vercel serverless entry point.
// Vercel auto-builds this file (api/ directory) with @vercel/node and forwards
// all rewrites from vercel.json into the existing Express app.
const app = require("../src/app");

module.exports = app;
