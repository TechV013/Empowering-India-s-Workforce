const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function createToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role = "JOB_SEEKER" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!["JOB_SEEKER", "RECRUITER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role
      }
    });

    const token = createToken(user);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      profile: true
    }
  });

  res.json(user);
}

module.exports = { register, login, me };