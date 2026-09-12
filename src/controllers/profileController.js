const prisma = require("../prisma");

async function getProfile(req, res) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const {
      phone,
      location,
      education,
      experience,
      bio,
      linkedin,
      github,
      portfolio
    } = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: {
        phone, location, education, experience, bio,
        linkedin, github, portfolio
      },
      create: {
        userId: req.user.userId,
        phone, location, education, experience, bio,
        linkedin, github, portfolio
      }
    });

    res.json({
      message: "Profile updated",
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update profile" });
  }
}

module.exports = { getProfile, updateProfile };