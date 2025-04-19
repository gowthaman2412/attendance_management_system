const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Middleware to protect routes that require authentication
module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token verified for user ID:', decoded.id, 'with role:', decoded.role);

    // Add user from payload
    req.user = decoded;

    // Check if user still exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) }
    });
    
    if (!userExists) {
      console.log('Auth middleware: User no longer exists in database. ID:', decoded.id);
      return res.status(401).json({ msg: 'User no longer exists' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};