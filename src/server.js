require("dotenv").config();

const app = require("./app");
const prisma = require("./prisma");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected.");

    app.listen(PORT, () => {
      console.log(`WorkNext API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});