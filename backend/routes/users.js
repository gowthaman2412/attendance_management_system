const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const prisma = require('../prisma/client');

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Profile request from user ID:', req.user.id, 'with role:', req.user.role);
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true,
        lastActive: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/students/all
// @desc    Get all students
// @access  Private (Staff/Admin)
router.get('/students/all', auth, async (req, res) => {
  try {
    // Check if user is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { department } = req.query;
    
    // Build query
    const where = { role: 'student' };
    
    if (department) {
      where.department = department;
    }
    
    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        department: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/staff/all
// @desc    Get all staff
// @access  Private (Admin)
router.get('/staff/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { department } = req.query;
    
    // Build query
    const where = { role: 'staff' };
    
    if (department) {
      where.department = department;
    }
    
    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        staffId: true,
        department: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/device-token
// @desc    Update device token for push notifications
// @access  Private
router.put('/device-token', auth, async (req, res) => {
  try {
    const { deviceToken } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({ msg: 'Device token is required' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: {
        deviceToken,
        lastActive: new Date()
      }
    });
    
    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ msg: 'Device token updated' });
  } catch (err) {
    console.error('Error updating device token:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/recent
// @desc    Get recently registered users
// @access  Private (Admin)
router.get('/recent', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Get the 5 most recently created users
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    res.json(recentUsers);
  } catch (err) {
    console.error('Error fetching recent users:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users
// @desc    Get all users (with pagination and filtering)
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { role, department, page = 1, limit = 10, search } = req.query;
    
    // Build query
    let where = {};
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (department) {
      where.department = department;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
      
      // Add student/staff ID search if available in Prisma
      if (role === 'student') {
        where.OR.push({ studentId: { contains: search, mode: 'insensitive' } });
      } else if (role === 'staff' || role === 'admin') {
        where.OR.push({ staffId: { contains: search, mode: 'insensitive' } });
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });
    
    // Get total count
    const total = await prisma.user.count({ where });
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or Self)
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate ID parameter
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }
    
    // Check if user is admin or self
    if (req.user.role !== 'admin' && parseInt(req.user.id) !== userId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true,
        lastActive: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user by ID:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin or Self)
router.put('/:id', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is admin or self
    if (req.user.role !== 'admin' && parseInt(req.user.id) !== userId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { name, email, department, profileImage, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if email is already in use by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
    }
    
    // Build update data
    const updateData = {
      name,
      email
    };
    
    if (department) updateData.department = department;
    if (profileImage) updateData.profileImage = profileImage;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    // Additional fields that only admin can update
    if (req.user.role === 'admin') {
      const { role, studentId, staffId } = req.body;
      
      if (role) updateData.role = role;
      if (role === 'student' && studentId) updateData.studentId = studentId;
      if ((role === 'staff' || role === 'admin') && staffId) updateData.staffId = staffId;
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const deleted = await prisma.user.delete({
      where: { id: userId }
    });
    
    if (!deleted) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;