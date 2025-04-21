const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const prisma = require('../prisma/client');

// @route   POST api/attendance/check-in
// @desc    Check in to a course
// @access  Private (Student)
router.post('/check-in', [
  auth,
  check('courseId', 'Course ID is required').not().isEmpty(),
  check('location', 'Location is required').isObject(),
  check('location.coordinates', 'Coordinates are required').isArray().isLength({ min: 2, max: 2 })
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can check in' });
    }

    const { courseId, location } = req.body;
    
    // Check if course exists and student is enrolled
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: parseInt(courseId),
          userId: parseInt(req.user.id)
        }
      },
      include: {
        course: {
          include: {
            schedules: true
          }
        }
      }
    });
    
    if (!enrollment) {
      return res.status(403).json({ msg: 'Student not enrolled in this course' });
    }
    
    const course = enrollment.course;

    // Get current day and time
    const now = new Date();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

    // Find if there's a scheduled class for this course today
    const todaySchedule = course.schedules.find(s => s.day === currentDay);
    if (!todaySchedule) {
      return res.status(400).json({ msg: 'No class scheduled for today' });
    }

    // Check if current time is within class time (with 15 min buffer)
    const startTime = todaySchedule.startTime;
    const endTime = todaySchedule.endTime;
    
    // Convert times to comparable format (minutes since midnight)
    const convertTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const currentMinutes = convertTimeToMinutes(currentTime);
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    
    // Allow check-in from 15 minutes before class until end of class
    if (currentMinutes < startMinutes - 15 || currentMinutes > endMinutes) {
      return res.status(400).json({ 
        msg: 'Check-in only allowed from 15 minutes before class until end of class',
        currentTime,
        classTime: `${startTime} - ${endTime}`
      });
    }

    // Verify location is within geofence
    const classLocation = todaySchedule.locationCoordinates;
    const studentLocation = location;
    
    // Calculate distance between two points using Haversine formula
    const calculateDistance = (coords1, coords2) => {
      const [lon1, lat1] = coords1;
      const [lon2, lat2] = coords2;
      
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in meters
    };
    
    const distance = calculateDistance(
      classLocation.coordinates,
      studentLocation.coordinates
    );
    
    const geofenceRadius = process.env.GEOFENCE_RADIUS || 50; // Default 50 meters
    
    let status = 'present';
    let verificationMethod = 'geolocation';
    
    // If outside geofence, mark as present but flag for review
    if (distance > geofenceRadius) {
      status = 'present'; // Still mark as present but with a note
      verificationMethod = 'manual'; // Will need manual verification
    }
    
    // Check if student is late (more than 10 minutes after start time)
    if (currentMinutes > startMinutes + 10) {
      status = 'late';
    }

    // Check if attendance record already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find existing attendance record
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(req.user.id),
        courseId: parseInt(courseId),
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let attendance;
    
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          checkInTime: now,
          location: studentLocation,
          verificationMethod,
          notes: distance > geofenceRadius ? 
            `Location verification failed. Distance from class: ${Math.round(distance)}m` : 
            ''
        }
      });
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          user: { connect: { id: parseInt(req.user.id) } },
          course: { connect: { id: parseInt(courseId) } },
          date: now,
          status,
          checkInTime: now,
          location: studentLocation,
          verificationMethod,
          notes: distance > geofenceRadius ? 
            `Location verification failed. Distance from class: ${Math.round(distance)}m` : 
            ''
        }
      });
    }

    res.json({
      success: true,
      attendance,
      locationVerified: distance <= geofenceRadius,
      distance: Math.round(distance)
    });
  } catch (err) {
    console.error('Error checking in:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/attendance/check-out
// @desc    Check out from a course
// @access  Private (Student)
router.post('/check-out', [
  auth,
  check('courseId', 'Course ID is required').not().isEmpty()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can check out' });
    }

    const { courseId } = req.body;
    
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(req.user.id),
        courseId: parseInt(courseId),
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({ msg: 'No check-in record found for today' });
    }

    // Update check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date()
      }
    });

    res.json({
      success: true,
      attendance: updatedAttendance
    });
  } catch (err) {
    console.error('Error checking out:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/student
// @desc    Get attendance records for the logged-in student
// @access  Private
router.get('/student', auth, async (req, res) => {
  try {
    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Get query parameters
    const { courseId, status, startDate, endDate } = req.query;
    
    // Build query
    const where = { userId: parseInt(req.user.id) };
    
    if (courseId) {
      where.courseId = parseInt(courseId);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        course: { include: { department: true } },
        user: true // Remove department from include, as it's a scalar
      },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (err) {
    console.error('Error getting student attendance:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/course/:courseId
// @desc    Get attendance records for a course
// @access  Private (Staff/Admin)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    // Check if user is staff or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { date } = req.query;
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if staff is the instructor of the course or an admin
    if (user.role === 'staff' && course.instructorId !== parseInt(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to view this course\'s attendance' });
    }

    // Build query
    const where = { courseId: parseInt(courseId) };
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: queryDate,
        lt: nextDay
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        course: { include: { department: true } },
        user: { include: { department: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (err) {
    console.error('Error getting course attendance:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/:courseId/:date
// @desc    Get attendance records for a course on a specific date
// @access  Private (Staff/Admin)
router.get('/:courseId/:date', auth, async (req, res) => {
  try {
    const { courseId, date } = req.params;
    // Check if user is staff or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    // Check if staff is the instructor of the course or an admin
    if (user.role === 'staff' && course.instructorId !== parseInt(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to view this course attendance' });
    }
    // Find attendance records for the course on the given date
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    // Get all students enrolled in the course
    const courseWithStudents = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                studentId: true,
                email: true,
                department: true
              }
            }
          }
        }
      }
    });
    // Get attendance records for the course/date
    const attendance = await prisma.attendance.findMany({
      where: {
        courseId: parseInt(courseId),
        date: {
          gte: queryDate,
          lt: nextDay
        }
      }
    });
    // Map attendance by userId for quick lookup
    const attendanceMap = {};
    attendance.forEach(a => { attendanceMap[a.userId] = a; });
    // Build response: for each student, include their details and attendance (if any)
    const response = courseWithStudents.students.map(enrollment => {
      const user = enrollment.user;
      const att = attendanceMap[user.id];
      return {
        id: user.id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        department: user.department,
        status: att ? att.status : 'absent',
        note: att ? att.notes : '',
        attendanceId: att ? att.id : null
      };
    });
    res.json(response);
  } catch (err) {
    console.error('Error fetching attendance for course/date:', err);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/attendance/:id
// @desc    Update attendance record (for manual verification)
// @access  Private (Staff/Admin)
router.put('/:id', [
  auth,
  check('status', 'Status is required').isIn(['present', 'absent', 'late', 'excused'])
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is staff or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { status, notes } = req.body;
    
    // Find attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { course: true }
    });
    
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    
    // Check if staff is the instructor of the course or an admin
    if (user.role === 'staff' && attendance.course.instructorId !== parseInt(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to update this attendance record' });
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        verificationMethod: 'manual',
        verifiedById: parseInt(req.user.id),
        notes: notes || undefined
      }
    });

    res.json(updatedAttendance);
  } catch (err) {
    console.error('Error updating attendance record:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/stats/student/:studentId
// @desc    Get attendance statistics for a student
// @access  Private (Staff/Admin/Student)
router.get('/stats/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, semester, year } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(studentId)) {
      return res.status(403).json({ msg: 'Students can only view their own attendance statistics' });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { 
        id: parseInt(studentId),
        role: 'student'
      }
    });
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Build query
    const where = { userId: parseInt(studentId) };
    
    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    // Add semester and year filters if provided
    if (semester || year) {
      let courseQuery = {};
      
      if (semester) courseQuery.semester = semester;
      if (year) courseQuery.year = parseInt(year);
      
      const courses = await prisma.course.findMany({
        where: courseQuery,
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      if (courseIds.length === 0) {
        return res.json({
          totalClasses: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentages: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          }
        });
      }
      
      if (!courseId) { // Only apply if specific courseId wasn't provided
        where.courseId = { in: courseIds };
      }
    }

    // Get all attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where
    });
    
    // Calculate statistics
    const stats = {
      totalClasses: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.status === 'present').length,
      absent: attendanceRecords.filter(record => record.status === 'absent').length,
      late: attendanceRecords.filter(record => record.status === 'late').length,
      excused: attendanceRecords.filter(record => record.status === 'excused').length
    };
    
    // Calculate percentages
    const percentages = {};
    if (stats.totalClasses > 0) {
      percentages.present = Math.round((stats.present / stats.totalClasses) * 100);
      percentages.absent = Math.round((stats.absent / stats.totalClasses) * 100);
      percentages.late = Math.round((stats.late / stats.totalClasses) * 100);
      percentages.excused = Math.round((stats.excused / stats.totalClasses) * 100);
    } else {
      percentages.present = 0;
      percentages.absent = 0;
      percentages.late = 0;
      percentages.excused = 0;
    }
    
    // Add percentages to stats
    stats.percentages = percentages;
    
    // If course specific, add course details
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        include: { schedules: true }
      });
      
      if (course) {
        // Calculate total scheduled classes for this course
        const totalScheduledClasses = course.schedules.length;
        stats.totalScheduledClasses = totalScheduledClasses;
        stats.attendanceRate = totalScheduledClasses > 0 ? 
          Math.round(((stats.present + stats.late) / totalScheduledClasses) * 100) : 0;
        stats.course = {
          id: course.id,
          name: course.name,
          code: course.code
        };
      }
    }
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting student statistics:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/attendance/summary
// @desc    Get attendance summary for the logged-in user
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = parseInt(req.user.id);
    
    // Get all attendance records for this user using Prisma
    const attendanceRecords = await prisma.attendance.findMany({
      where: { 
        userId: userId 
      }
    });
    
    // Calculate statistics
    const stats = {
      totalClasses: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.status === 'present').length,
      absent: attendanceRecords.filter(record => record.status === 'absent').length,
      late: attendanceRecords.filter(record => record.status === 'late').length,
      excused: attendanceRecords.filter(record => record.status === 'excused').length
    };
    
    // Calculate percentages
    let presentPercentage = 0;
    let absentPercentage = 0;
    let latePercentage = 0;
    let excusedPercentage = 0;
    
    if (stats.totalClasses > 0) {
      presentPercentage = Math.round((stats.present / stats.totalClasses) * 100);
      absentPercentage = Math.round((stats.absent / stats.totalClasses) * 100);
      latePercentage = Math.round((stats.late / stats.totalClasses) * 100);
      excusedPercentage = Math.round((stats.excused / stats.totalClasses) * 100);
    }
    
    // Return the summary
    res.json({
      totalClasses: stats.totalClasses,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
      presentPercentage,
      absentPercentage,
      latePercentage,
      excusedPercentage
    });
  } catch (err) {
    console.error('Error getting attendance summary:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/attendance/bulk
// @desc    Bulk create or update attendance records
// @access  Private (Staff/Admin)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { attendance } = req.body;
    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({ msg: 'Attendance array is required' });
    }
    // Only staff or admin can use this endpoint
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const results = [];
    for (const record of attendance) {
      const { student, course, date, status, note } = record;
      if (!student || !course || !date || !status) continue;
      // Support both student ID (number) and studentId (string)
      let userObj = null;
      if (typeof student === 'string' && isNaN(Number(student))) {
        // If student is a string but not a number, skip
        continue;
      }
      if (typeof student === 'string' && student.length > 0 && isNaN(Number(student)) === false) {
        // If student is a string of digits, treat as studentId
        userObj = await prisma.user.findFirst({ where: { studentId: student, role: 'student' } });
      } else if (!isNaN(Number(student))) {
        // If student is a number, treat as userId
        userObj = await prisma.user.findUnique({ where: { id: parseInt(student) } });
      }
      if (!userObj) continue;
      // Find existing attendance for this student/course/date
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      let att = await prisma.attendance.findFirst({
        where: {
          userId: userObj.id,
          courseId: parseInt(course),
          date: { gte: start, lt: end }
        }
      });
      if (att) {
        // Update
        att = await prisma.attendance.update({
          where: { id: att.id },
          data: { status, notes: note || undefined }
        });
      } else {
        // Create
        att = await prisma.attendance.create({
          data: {
            userId: userObj.id,
            courseId: parseInt(course),
            date: new Date(date),
            status,
            notes: note || undefined,
            location: {} // Provide empty object if location is not supplied
          }
        });
      }
      results.push(att);
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error in bulk attendance:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;