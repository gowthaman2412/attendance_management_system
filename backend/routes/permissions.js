const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const prisma = require('../prisma/client');

// @route   POST api/permissions
// @desc    Create a new permission request
// @access  Private (Student)
router.post('/', auth, async (req, res) => {
  try {
    // Support both JSON and formData
    let body = req.body;
    console.log("body:",body)
    // If formData, fields may not be parsed as expected, so use req.body directly
    // Normalize all possible field names and trim values
    const courseId = body.course || body.courseId || body['courseId'] || body['course'];
    const type = body.type || body['type'];
    const reason = body.reason || body['reason'];
    const startDate = body.startDate || body.date || body['startDate'] || body['date'];
    const endDate = body.endDate || body.date || body['endDate'] || body['date'];
    // Validate required fields
    const errors = [];
    if (!courseId) errors.push({ type: 'field', msg: 'Course ID is required', path: 'courseId', location: 'body' });
    if (!type) errors.push({ type: 'field', msg: 'Permission type is required', path: 'type', location: 'body' });
    if (!reason) errors.push({ type: 'field', msg: 'Reason is required', path: 'reason', location: 'body' });
    if (!startDate) errors.push({ type: 'field', msg: 'Start date is required', path: 'startDate', location: 'body' });
    if (!endDate) errors.push({ type: 'field', msg: 'End date is required', path: 'endDate', location: 'body' });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can create permission requests' });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: parseInt(courseId),
          userId: parseInt(req.user.id)
        }
      }
    });
    
    if (!enrollment) {
      return res.status(403).json({ msg: 'Student not enrolled in this course' });
    }

    // Create new permission request
    const permission = await prisma.permission.create({
      data: {
        type,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        attachments: req.body.attachments || [],
        user: {
          connect: { id: parseInt(req.user.id) }
        },
        course: {
          connect: { id: parseInt(courseId) }
        }
      },
      include: {
        user: true,
        course: true
      }
    });

    res.json(permission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions
// @desc    Get all permission requests for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, courseId } = req.query;
    
    // Build query
    const where = {};
    
    // Students can only see their own permissions
    if (req.user.role === 'student') {
      where.userId = parseInt(req.user.id);
    }
    
    // Staff can only see permissions for courses they teach
    if (req.user.role === 'staff') {
      // Get courses taught by this staff
      const courses = await prisma.course.findMany({
        where: { instructorId: parseInt(req.user.id) },
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      where.courseId = { in: courseIds };
    }
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }
    
    // Filter by course if provided
    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        user: true,
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(permissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/pending
// @desc    Get pending permission requests
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // Build query
    const where = {
      status: 'pending'
    };
    
    // Students can only see their own permissions
    if (req.user.role === 'student') {
      where.userId = parseInt(req.user.id);
    }
    
    // Staff can only see permissions for courses they teach
    if (req.user.role === 'staff') {
      // Get courses taught by this staff
      const courses = await prisma.course.findMany({
        where: { instructorId: parseInt(req.user.id) },
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      where.courseId = { in: courseIds };
    }
    
    // Filter by course if provided
    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        user: true,
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(permissions);
  } catch (err) {
    console.error('Error fetching pending permissions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/approved
// @desc    Get approved permission requests
// @access  Private
router.get('/approved', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // Build query
    const where = {
      status: 'approved'
    };
    
    // Students can only see their own permissions
    if (req.user.role === 'student') {
      where.userId = parseInt(req.user.id);
    }
    
    // Staff can only see permissions for courses they teach
    if (req.user.role === 'staff') {
      // Get courses taught by this staff
      const courses = await prisma.course.findMany({
        where: { instructorId: parseInt(req.user.id) },
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      where.courseId = { in: courseIds };
    }
    
    // Filter by course if provided
    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        user: true,
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(permissions);
  } catch (err) {
    console.error('Error fetching approved permissions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/rejected
// @desc    Get rejected permission requests
// @access  Private
router.get('/rejected', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // Build query
    const where = {
      status: 'rejected'
    };
    
    // Students can only see their own permissions
    if (req.user.role === 'student') {
      where.userId = parseInt(req.user.id);
    }
    
    // Staff can only see permissions for courses they teach
    if (req.user.role === 'staff') {
      // Get courses taught by this staff
      const courses = await prisma.course.findMany({
        where: { instructorId: parseInt(req.user.id) },
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      where.courseId = { in: courseIds };
    }
    
    // Filter by course if provided
    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        user: true,
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(permissions);
  } catch (err) {
    console.error('Error fetching rejected permissions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/recent
// @desc    Get recent permission requests (for admin dashboard)
// @access  Private (Admin)
router.get('/recent', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const permissions = await prisma.permission.findMany({
      take: 5, // Limit to 5 most recent
      include: {
        user: true,
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(permissions);
  } catch (err) {
    console.error('Error fetching recent permissions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/student
// @desc    Get permission requests for the logged-in student
// @access  Private (Student)
router.get('/student', auth, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Get student's permission requests
    const permissions = await prisma.permission.findMany({
      where: {
        userId: parseInt(req.user.id)
      },
      include: {
        course: true,
        reviewer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(permissions);
  } catch (err) {
    console.error('Error fetching student permissions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/permissions/:id
// @desc    Get permission request by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate that id is a number
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ msg: 'Invalid permission ID format' });
    }
    
    const permission = await prisma.permission.findUnique({
      where: { id: id },
      include: {
        user: true,
        course: true,
        reviewer: true
      }
    });

    if (!permission) {
      return res.status(404).json({ msg: 'Permission request not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && permission.userId !== parseInt(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to view this permission request' });
    }

    if (req.user.role === 'staff') {
      // Check if staff is the instructor of the course
      const course = await prisma.course.findUnique({
        where: { id: permission.courseId }
      });
      
      if (course.instructorId !== parseInt(req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized to view this permission request' });
      }
    }

    res.json(permission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/permissions/:id
// @desc    Update permission request status (approve/reject)
// @access  Private (Staff/Admin)
router.put('/:id', [
  auth,
  check('status', 'Status is required').isIn(['approved', 'rejected'])
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update permission requests' });
    }

    const { status, reviewNotes } = req.body;

    // Find permission request
    const permission = await prisma.permission.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!permission) {
      return res.status(404).json({ msg: 'Permission request not found' });
    }

    // Check if staff is the instructor of the course or an admin
    if (req.user.role === 'staff') {
      const course = await prisma.course.findUnique({
        where: { id: permission.courseId }
      });
      
      if (course.instructorId !== parseInt(req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized to update this permission request' });
      }
    }

    // Update permission request
    const updatedPermission = await prisma.permission.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        reviewNotes,
        reviewDate: new Date(),
        reviewer: {
          connect: { id: parseInt(req.user.id) }
        }
      },
      include: {
        user: true,
        course: true,
        reviewer: true
      }
    });

    res.json(updatedPermission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/permissions/:id
// @desc    Delete permission request
// @access  Private (Student - only if pending)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find permission request
    const permission = await prisma.permission.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!permission) {
      return res.status(404).json({ msg: 'Permission request not found' });
    }

    // Check authorization
    if (req.user.role === 'student') {
      // Students can only delete their own pending requests
      if (permission.userId !== parseInt(req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized to delete this permission request' });
      }

      if (permission.status !== 'pending') {
        return res.status(400).json({ msg: 'Cannot delete permission request that has been reviewed' });
      }
    } else if (req.user.role === 'staff') {
      // Staff can only delete requests for courses they teach
      const course = await prisma.course.findUnique({
        where: { id: permission.courseId }
      });
      
      if (course.instructorId !== parseInt(req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized to delete this permission request' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete permission requests' });
    }

    await prisma.permission.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ msg: 'Permission request deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;