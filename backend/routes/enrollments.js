const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   POST api/enrollments
// @desc    Create new enrollment
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    let { studentId, courseCode } = req.body;

    // Ensure studentId is an integer and courseCode is provided
    studentId = parseInt(studentId);
    if (isNaN(studentId) || !courseCode) {
      return res.status(400).json({ msg: 'Invalid studentId or courseCode' });
    }
    
    // Validate student exists and is a student
    // Use findFirst with where: { studentId: String(studentId), role: 'student' }
    const student = await prisma.user.findFirst({
      where: { studentId: String(studentId), role: 'student' }
    });
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Get course by code
    const course = await prisma.course.findUnique({
      where: { code: courseCode }
    });

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    const enrollment = await prisma.courseStudent.create({
      data: {
        userId: student.id,
        courseId: course.id,
        departmentId: course.departmentId
      }
    });

    res.json(enrollment);
  } catch (err) {
    console.error('Error creating enrollment:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/enrollments
// @desc    Get all enrollments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const enrollments = await prisma.courseStudent.findMany({
      include: {
        user: true,
        course: true,
        department: true
      }
    });
    res.json(enrollments);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/enrollments/student/:studentId
// @desc    Get enrollments by student ID
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const enrollments = await prisma.courseStudent.findMany({
      where: {
        userId: parseInt(studentId)
      },
      include: {
        course: {
          include: {
            department: true
          }
        }
      }
    });

    res.json(enrollments);
  } catch (err) {
    console.error('Error fetching student enrollments:', err);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/enrollments/:id
// @desc    Delete enrollment by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.courseStudent.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ msg: 'Enrollment removed' });
  } catch (err) {
    console.error('Error deleting enrollment:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;