const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/reports/attendance
// @desc    Attendance report for admin
// @access  Private (Admin)
router.get('/attendance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const { department, course, startDate, endDate } = req.query;
    // Build query
    const where = {};
    if (department) {
      where['course'] = { departmentId: parseInt(department) };
    }
    if (course) {
      where['courseId'] = parseInt(course);
    }
    if (startDate && endDate) {
      where['date'] = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: { course: true }
    });
    // Calculate overall stats
    const overallStats = {
      present: attendanceRecords.filter(r => r.status === 'present').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      excused: attendanceRecords.filter(r => r.status === 'excused').length
    };
    // Calculate course stats
    const courseStatsMap = {};
    attendanceRecords.forEach(r => {
      const code = r.course?.code || 'Unknown';
      if (!courseStatsMap[code]) {
        courseStatsMap[code] = { code, present: 0, late: 0, absent: 0, excused: 0 };
      }
      courseStatsMap[code][r.status]++;
    });
    const courseStats = Object.values(courseStatsMap);
    res.json({ overallStats, courseStats });
  } catch (err) {
    console.error('Error fetching attendance report:', err);
    res.status(500).json({ msg: 'Server error fetching attendance report' });
  }
});

// @route   GET api/reports/courses
// @desc    Course report for admin
// @access  Private (Admin)
router.get('/courses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const { department } = req.query;
    const where = {};
    if (department) {
      where.departmentId = parseInt(department);
    }
    const courses = await prisma.course.findMany({
      where,
      include: { department: true, students: true }
    });
    // Enrollment stats by department
    const enrollmentStatsMap = {};
    courses.forEach(course => {
      const deptName = course.department?.name || 'Unknown';
      if (!enrollmentStatsMap[deptName]) {
        enrollmentStatsMap[deptName] = { name: deptName, studentCount: 0 };
      }
      enrollmentStatsMap[deptName].studentCount += course.students.length;
    });
    const enrollmentStats = Object.values(enrollmentStatsMap);
    res.json({ enrollmentStats });
  } catch (err) {
    console.error('Error fetching course report:', err);
    res.status(500).json({ msg: 'Server error fetching course report' });
  }
});

// @route   GET api/reports/permissions
// @desc    Permission report for admin
// @access  Private (Admin)
router.get('/permissions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const { department, startDate, endDate } = req.query;
    // Build query
    const where = {};
    if (department) {
      where['course'] = { departmentId: parseInt(department) };
    }
    if (startDate && endDate) {
      where['createdAt'] = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    const permissions = await prisma.permission.findMany({
      where,
      include: { course: true }
    });
    // Permission stats
    const permissionStats = {
      approved: permissions.filter(p => p.status === 'approved').length,
      pending: permissions.filter(p => p.status === 'pending').length,
      rejected: permissions.filter(p => p.status === 'rejected').length
    };
    res.json({ permissionStats });
  } catch (err) {
    console.error('Error fetching permission report:', err);
    res.status(500).json({ msg: 'Server error fetching permission report' });
  }
});

module.exports = router;