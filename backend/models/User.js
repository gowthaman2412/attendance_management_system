const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma/client');

// Get user by ID
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id: parseInt(id) }
  });
}

// Get user by email
async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

// Create a new user
async function createUser(userData) {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword
    }
  });
}

// Update user
async function updateUser(id, userData) {
  // If password is being updated, hash it
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }

  return prisma.user.update({
    where: { id: parseInt(id) },
    data: userData
  });
}

// Delete user
async function deleteUser(id) {
  return prisma.user.delete({
    where: { id: parseInt(id) }
  });
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
}

// Match password
async function matchPassword(enteredPassword, hashedPassword) {
  return await bcrypt.compare(enteredPassword, hashedPassword);
}

// Generate password reset token
async function generateResetToken(userId) {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  // Update user with reset token info
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      resetPasswordToken,
      resetPasswordExpire
    }
  });

  return resetToken;
}

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  generateToken,
  matchPassword,
  generateResetToken
};