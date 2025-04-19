const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../prisma/client');

// @route   GET api/analytics/attendance/course/:courseId
// @desc    Get attendance analytics for a course
// @access  Private (Staff/Admin)
router.get('/attendance/course/:courseId', auth, async (req, res) => {
  try {
    // Check if user is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { courseId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if staff is the instructor of the course or an admin
    if (req.user.role === 'staff' && course.instructorId !== parseInt(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to view this course\'s analytics' });
    }

    // Build query
    const where = { courseId: parseInt(courseId) };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get all attendance records for this course
    const attendanceRecords = await prisma.attendance.findMany({
      where
    });
    
    // Calculate overall statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
    const excusedCount = attendanceRecords.filter(record => record.status === 'excused').length;
    
    // Calculate percentages
    const presentPercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    const latePercentage = totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0;
    const absentPercentage = totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0;
    const excusedPercentage = totalRecords > 0 ? Math.round((excusedCount / totalRecords) * 100) : 0;
    
    // Get student-specific statistics
    const studentStats = [];
    
    // Get all students enrolled in the course using Prisma
    const students = await prisma.courseStudent.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        }
      }
    });
    
    // Calculate statistics for each student
    for (const enrollment of students) {
      const student = enrollment.user;
      
      // Get student's attendance records
      const studentRecords = attendanceRecords.filter(
        record => record.userId === student.id
      );
      
      const studentTotalRecords = studentRecords.length;
      const studentPresentCount = studentRecords.filter(record => record.status === 'present').length;
      const studentLateCount = studentRecords.filter(record => record.status === 'late').length;
      const studentAbsentCount = studentRecords.filter(record => record.status === 'absent').length;
      const studentExcusedCount = studentRecords.filter(record => record.status === 'excused').length;
      
      studentStats.push({
        student: {
          id: student.id,
          name: student.name,
          studentId: student.studentId
        },
        totalClasses: studentTotalRecords,
        present: studentPresentCount,
        late: studentLateCount,
        absent: studentAbsentCount,
        excused: studentExcusedCount,
        attendanceRate: studentTotalRecords > 0 ? 
          Math.round(((studentPresentCount + studentLateCount) / studentTotalRecords) * 100) : 0
      });
    }
    
    // Sort students by attendance rate (descending)
    studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);
    
    res.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code
      },
      overallStats: {
        totalRecords,
        present: {
          count: presentCount,
          percentage: presentPercentage
        },
        late: {
          count: lateCount,
          percentage: latePercentage
        },
        absent: {
          count: absentCount,
          percentage: absentPercentage
        },
        excused: {
          count: excusedCount,
          percentage: excusedPercentage
        }
      },
      studentStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/attendance/trends
// @desc    Get attendance trends over time
// @access  Private (Staff/Admin)
router.get('/attendance/trends', auth, async (req, res) => {
  try {
    // Check if user is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { courseId, period = 'daily' } = req.query;
    
    // Build query
    const where = {};
    
    // Staff can only view courses they teach
    if (req.user.role === 'staff') {
      if (courseId) {
        // Check if staff is the instructor of the course
        const course = await prisma.course.findUnique({
          where: { id: parseInt(courseId) }
        });
        
        if (!course || course.instructorId !== parseInt(req.user.id)) {
          return res.status(403).json({ msg: 'Not authorized to view this course\'s analytics' });
        }
        where.courseId = parseInt(courseId);
      } else {
        // Get all courses taught by this staff
        const courses = await prisma.course.findMany({
          where: { instructorId: parseInt(req.user.id) },
          select: { id: true }
        });
        
        const courseIds = courses.map(course => course.id);
        
        where.courseId = { in: courseIds };
      }
    } else if (courseId) {
      // Admin can view any course
      where.courseId = parseInt(courseId);
    }
    
    // Get all attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    
    // Group records by date based on period
    const groupedRecords = {};
    
    attendanceRecords.forEach(record => {
      let key;
      const date = new Date(record.date);
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        // Get the Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        const monday = new Date(date.setDate(diff));
        key = monday.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          excused: 0
        };
      }
      
      groupedRecords[key].total++;
      groupedRecords[key][record.status]++;
    });
    
    // Convert to array and calculate percentages
    const trends = Object.keys(groupedRecords).map(date => {
      const stats = groupedRecords[date];
      return {
        date,
        total: stats.total,
        present: {
          count: stats.present,
          percentage: Math.round((stats.present / stats.total) * 100)
        },
        late: {
          count: stats.late,
          percentage: Math.round((stats.late / stats.total) * 100)
        },
        absent: {
          count: stats.absent,
          percentage: Math.round((stats.absent / stats.total) * 100)
        },
        excused: {
          count: stats.excused,
          percentage: Math.round((stats.excused / stats.total) * 100)
        }
      };
    });
    
    // Sort by date
    trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      period,
      trends
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/permissions
// @desc    Get permission request analytics
// @access  Private (Staff/Admin)
router.get('/permissions', auth, async (req, res) => {
  try {
    // Check if user is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { courseId, startDate, endDate } = req.query;
    
    // Build query
    const where = {};
    
    // Staff can only view courses they teach
    if (req.user.role === 'staff') {
      if (courseId) {
        // Check if staff is the instructor of the course
        const course = await prisma.course.findUnique({
          where: { id: parseInt(courseId) }
        });
        
        if (!course || course.instructorId !== parseInt(req.user.id)) {
          return res.status(403).json({ msg: 'Not authorized to view this course\'s analytics' });
        }
        where.courseId = parseInt(courseId);
      } else {
        // Get all courses taught by this staff
        const courses = await prisma.course.findMany({
          where: { instructorId: parseInt(req.user.id) },
          select: { id: true }
        });
        
        const courseIds = courses.map(course => course.id);
        
        where.courseId = { in: courseIds };
      }
    } else if (courseId) {
      // Admin can view any course
      where.courseId = parseInt(courseId);
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    // Get all permission requests
    const permissions = await prisma.permission.findMany({
      where
    });
    
    // Calculate statistics
    const totalRequests = permissions.length;
    const pendingCount = permissions.filter(p => p.status === 'pending').length;
    const approvedCount = permissions.filter(p => p.status === 'approved').length;
    const rejectedCount = permissions.filter(p => p.status === 'rejected').length;
    
    // Group by type
    const absenceCount = permissions.filter(p => p.type === 'absence').length;
    const lateCount = permissions.filter(p => p.type === 'late').length;
    const earlyLeaveCount = permissions.filter(p => p.type === 'early-leave').length;
    
    // Calculate percentages
    const pendingPercentage = totalRequests > 0 ? Math.round((pendingCount / totalRequests) * 100) : 0;
    const approvedPercentage = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;
    const rejectedPercentage = totalRequests > 0 ? Math.round((rejectedCount / totalRequests) * 100) : 0;
    
    const absencePercentage = totalRequests > 0 ? Math.round((absenceCount / totalRequests) * 100) : 0;
    const latePercentage = totalRequests > 0 ? Math.round((lateCount / totalRequests) * 100) : 0;
    const earlyLeavePercentage = totalRequests > 0 ? Math.round((earlyLeaveCount / totalRequests) * 100) : 0;
    
    res.json({
      totalRequests,
      byStatus: {
        pending: {
          count: pendingCount,
          percentage: pendingPercentage
        },
        approved: {
          count: approvedCount,
          percentage: approvedPercentage
        },
        rejected: {
          count: rejectedCount,
          percentage: rejectedPercentage
        }
      },
      byType: {
        absence: {
          count: absenceCount,
          percentage: absencePercentage
        },
        late: {
          count: lateCount,
          percentage: latePercentage
        },
        earlyLeave: {
          count: earlyLeaveCount,
          percentage: earlyLeavePercentage
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/stats
// @desc    Get overall system statistics for admin dashboard
// @access  Private (Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Get count of students
    const totalStudents = await prisma.user.count({
      where: { role: 'student' }
    });
    
    // Get count of staff
    const totalStaff = await prisma.user.count({
      where: { role: 'staff' }
    });
    
    // Get count of courses
    const totalCourses = await prisma.course.count();
    
    // Get count of pending permissions
    const pendingPermissions = await prisma.permission.count({
      where: { status: 'pending' }
    });
    
    // Get attendance statistics
    const attendanceRecords = await prisma.attendance.findMany();
    const totalAttendanceRecords = attendanceRecords.length;
    
    let attendanceStats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };
    
    if (totalAttendanceRecords > 0) {
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
      const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
      const excusedCount = attendanceRecords.filter(record => record.status === 'excused').length;
      
      attendanceStats = {
        present: Math.round((presentCount / totalAttendanceRecords) * 100),
        absent: Math.round((absentCount / totalAttendanceRecords) * 100),
        late: Math.round((lateCount / totalAttendanceRecords) * 100),
        excused: Math.round((excusedCount / totalAttendanceRecords) * 100)
      };
    }
    
    // Get department statistics
    const departmentStats = {};
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: { department: true }
    });
    
    students.forEach(student => {
      if (student.department) {
        departmentStats[student.department] = (departmentStats[student.department] || 0) + 1;
      }
    });
    
    // System status info
    const systemStatus = {
      server: 'Online',
      database: 'Connected',
      lastBackup: new Date().toISOString().split('T')[0], // Today's date as YYYY-MM-DD
      version: '1.0.0'
    };
    
    res.json({
      totalStudents,
      totalStaff,
      totalCourses,
      pendingPermissions,
      attendanceStats,
      departmentStats,
      systemStatus
    });
  } catch (err) {
    console.error('Error fetching system statistics:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;