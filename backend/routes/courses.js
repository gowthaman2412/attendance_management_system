const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/courses
// @desc    Get all courses (admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Transform data to format expected by frontend
    const formattedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      department: course.department,
      credits: course.credits,
      instructor: course.instructor,
      students: course.students.map(enrollment => enrollment.user)
    }));
    
    res.json(formattedCourses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/courses
// @desc    Create a new course
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { name, code, department, credits, instructor, semester = 'Spring', year = new Date().getFullYear() } = req.body;
    
    // Validate required fields
    if (!name || !code || !department) {
      return res.status(400).json({ msg: 'Name, code, and department are required fields' });
    }
    
    const courseData = {
      name,
      code,
      department,
      credits: credits ? parseInt(credits) : 3,
      semester,
      year
    };
    
    // If instructor is provided, add to course data
    if (instructor) {
      try {
        courseData.instructorId = parseInt(instructor);
      } catch (error) {
        console.error('Error parsing instructor ID:', error);
        return res.status(400).json({ msg: 'Invalid instructor ID format' });
      }
    }
    
    const course = await prisma.course.create({
      data: courseData,
      include: {
        instructor: true
      }
    });
    
    res.json(course);
  } catch (err) {
    console.error('Error creating course:', err);
    if (err.code === 'P2003') {
      return res.status(400).json({ msg: 'The instructor ID does not exist' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/courses/:id
// @desc    Update a course
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    const { id } = req.params;
    const { name, code, department, credits, instructor } = req.body;
    
    // Validate course ID
    let courseId;
    try {
      courseId = parseInt(id);
      if (isNaN(courseId)) {
        throw new Error('Invalid ID format');
      }
    } catch (error) {
      return res.status(400).json({ msg: 'Invalid course ID format' });
    }
    
    const courseData = {};
    if (name) courseData.name = name;
    if (code) courseData.code = code;
    if (department) courseData.department = department;
    if (credits) courseData.credits = parseInt(credits);
    
    // Handle instructor assignment
    if (instructor === '') {
      // Remove instructor assignment
      courseData.instructorId = null;
    } else if (instructor) {
      // Assign new instructor
      try {
        courseData.instructorId = parseInt(instructor);
      } catch (error) {
        console.error('Error parsing instructor ID:', error);
        return res.status(400).json({ msg: 'Invalid instructor ID format' });
      }
    }
    
    const course = await prisma.course.update({
      where: { id: courseId },
      data: courseData,
      include: {
        instructor: true
      }
    });
    
    res.json(course);
  } catch (err) {
    console.error('Error updating course:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ msg: 'The instructor ID does not exist' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    const { id } = req.params;
    
    // Validate course ID
    let courseId;
    try {
      courseId = parseInt(id);
      if (isNaN(courseId)) {
        throw new Error('Invalid ID format');
      }
    } catch (error) {
      return res.status(400).json({ msg: 'Invalid course ID format' });
    }
    
    // Delete course
    await prisma.course.delete({
      where: { id: courseId }
    });
    
    res.json({ msg: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        msg: 'Cannot delete this course because it has related records (students or schedules)' 
      });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/courses/student
// @desc    Get courses for the logged-in student
// @access  Private (Student)
router.get('/student', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can access their courses' });
    }
    // Find all courses where the student is enrolled
    const courses = await prisma.course.findMany({
      where: {
        students: {
          some: {
            id: req.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        department: true
      }
    });
    res.json(courses);
  } catch (err) {
    console.error('Error fetching student courses:', err);
    res.status(500).json({ msg: 'Server error fetching student courses' });
  }
});

// @route   GET api/courses/upcoming
// @desc    Get upcoming classes for the logged-in user
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { role, id } = req.user;
    
    // Get current date
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    
    // Filter based on user role
    let courseFilter = {};
    
    if (role === 'student') {
      courseFilter = {
        students: {
          some: {
            id: parseInt(id)
          }
        }
      };
    } else if (role === 'staff') {
      courseFilter = {
        instructorId: parseInt(id)
      };
    }
    
    // Find courses based on role filter
    const courses = await prisma.course.findMany({
      where: courseFilter,
      include: {
        schedules: {
          where: {
            day: dayOfWeek // Filter for today's classes
          }
        },
        instructor: {
          select: {
            id: true,
            name: true
          }
        },
        students: true
      }
    });
    
    // Transform data to format expected by frontend
    const upcomingClasses = courses
      .filter(course => course.schedules.length > 0) // Only courses with schedule today
      .flatMap(course => {
        return course.schedules.map(scheduleItem => ({
          _id: `${course.id}_${scheduleItem.id}`, // Create a unique ID
          course: {
            _id: course.id,
            name: course.name,
            code: course.code,
            students: course.students || []
          },
          date: now,
          startTime: scheduleItem.startTime,
          endTime: scheduleItem.endTime,
          location: {
            building: scheduleItem.building,
            room: scheduleItem.room,
            coordinates: scheduleItem.locationCoordinates
          }
        }));
      })
      // Sort by start time
      .sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    
    res.json(upcomingClasses);
  } catch (err) {
    console.error('Error fetching upcoming classes:', err);
    res.status(500).json({ msg: 'Server error fetching upcoming classes' });
  }
});

// @route   GET api/courses/staff
// @desc    Get courses for the logged-in staff member
// @access  Private (Staff)
router.get('/staff', auth, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ msg: 'Only staff can access their assigned courses' });
    }
    
    // Find all courses where the staff is the instructor
    const courses = await prisma.course.findMany({
      where: {
        instructorId: parseInt(req.user.id)
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Transform data to format expected by frontend
    const formattedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      department: course.department,
      semester: course.semester,
      year: course.year,
      students: course.students.map(enrollment => enrollment.user)
    }));
    
    res.json(formattedCourses);
  } catch (err) {
    console.error('Error fetching staff courses:', err);
    res.status(500).json({ msg: 'Server error fetching staff courses' });
  }
});

module.exports = router;