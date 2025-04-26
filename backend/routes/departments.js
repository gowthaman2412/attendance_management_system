const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/departments
// @desc    Get all departments
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/departments
// @desc    Create new department
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ msg: 'Name and code are required' });
    }

    const department = await prisma.department.create({
      data: { name, code }
    });

    res.json(department);
  } catch (err) {
    console.error('Error creating department:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ msg: 'Department with this name or code already exists' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/departments/:id
// @desc    Update department
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { name, code } = req.body;

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name, code }
    });

    res.json(department);
  } catch (err) {
    console.error('Error updating department:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ msg: 'Department with this name or code already exists' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/departments/:id
// @desc    Delete department
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check for associated courses
    const courses = await prisma.course.findMany({
      where: { departmentId: parseInt(id) }
    });

    if (courses.length > 0) {
      return res.status(400).json({
        msg: 'Cannot delete department with associated courses'
      });
    }

    await prisma.department.delete({
      where: { id: parseInt(id) }
    });

    res.json({ msg: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;