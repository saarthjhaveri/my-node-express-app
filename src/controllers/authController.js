const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const login = async (req, res) => {
  try {
    // Handle form-urlencoded data like FastAPI's OAuth2PasswordRequestForm
    const { username, password } = req.body;

    // Find user by email (username in the form is actually email)
    const user = await prisma.user.findUnique({
      where: { email: username },
    });

    if (!user) {
      return res.status(401).json({
        status_code: 401,
        detail: "Incorrect email or password",
        headers: { "WWW-Authenticate": "Bearer" }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        status_code: 401,
        detail: "Incorrect email or password",
        headers: { "WWW-Authenticate": "Bearer" }
      });
    }

    // Generate JWT token without expiration (matching FastAPI implementation)
    const token = jwt.sign(
      { sub: user.id },  // Using 'sub' to match FastAPI's token structure
      process.env.JWT_SECRET
      // No expiresIn parameter to match FastAPI's no-expiration behavior
    );

    // Return token in FastAPI's format
    return res.json({
      access_token: token,
      token_type: "bearer"
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status_code: 500,
      detail: "Internal server error"
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status_code: 404,
        detail: "User not found"
      });
    }

    return res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      status_code: 500,
      detail: "Internal server error"
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    return res.json({
      valid: true,
      user_id: req.user.id
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      status_code: 401,
      detail: "Invalid token",
      headers: { "WWW-Authenticate": "Bearer" }
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyToken
}; 