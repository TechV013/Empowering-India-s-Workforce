require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const jobs = [
    {
      title: "Data Analyst Intern",
      company: "WorkNext Demo",
      description: "Analyze business data, build dashboards and prepare reports.",
      location: "Dehradun",
      jobType: "Internship",
      salary: "₹10,000/month",
      experience: "Fresher",
      isRemote: false
    },
    {
      title: "Frontend Developer Intern",
      company: "Tech India",
      description: "Build responsive React interfaces and work with a product team.",
      location: "Remote",
      jobType: "Internship",
      salary: "₹12,000/month",
      experience: "Fresher",
      isRemote: true
    },
    {
      title: "Backend Developer",
      company: "Digital Solutions",
      description: "Develop REST APIs and database-backed services.",
      location: "Delhi",
      jobType: "Full-time",
      salary: "₹4-6 LPA",
      experience: "0-2 years",
      isRemote: false
    }
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }

  console.log("Seed jobs created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });