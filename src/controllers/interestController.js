const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const submitInterestForm = async (req, res) => {
  try {
    const { name, email, company, role, message } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        message: 'Name and email are required fields'
      });
    }

    // Create interest form submission
    const submission = await prisma.interestFormSubmission.create({
      data: {
        name,
        email,
        company,
        role,
        message,
        submitted_at: new Date(),
      }
    });

    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'Thank you for your interest!',
      data: submission
    });

  } catch (error) {
    console.error('Error processing interest form submission:', error);
    return res.status(500).json({
      message: 'Failed to process submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all submissions
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await prisma.interestFormSubmission.findMany({
      orderBy: {
        submitted_at: 'desc'
      }
    });

    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      message: 'Failed to fetch submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitInterestForm,
  getAllSubmissions
}; 