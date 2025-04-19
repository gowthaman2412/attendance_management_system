const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/departments
// @desc    Get all departments
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get unique departments from the database
    const departments = await prisma.course.findMany({
      select: {
        department: true
      },
      distinct: ['department'],
      where: {
        department: {
          not: ''
        }
      },
      orderBy: {
        department: 'asc'
      }
    });

    // Extract department names
    const departmentNames = departments.map(item => item.department);
    
    res.json(departmentNames);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 