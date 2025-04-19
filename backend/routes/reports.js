const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/reports/attendance
// @desc    Get attendance reports
// @access  Private (Admin)
router.get('/attendance', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { period = 'week', department } = req.query;
    
    // Get start date based on period
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Build query
    let whereClause = {
      date: {
        gte: startDate
      }
    };

    // Add department filter if provided
    if (department) {
      whereClause.course = {
        department
      };
    }

    try {
      // Get attendance data
      const attendanceData = await prisma.attendance.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              name: true,
              code: true,
              department: true
            }
          },
          user: {
            select: {
              name: true,
              studentId: true,
              department: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Group by date
      const groupedByDate = {};
      attendanceData.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = [];
        }
        groupedByDate[dateStr].push(record);
      });

      // Calculate totals for each day
      const dailyTotals = Object.keys(groupedByDate).map(date => {
        const records = groupedByDate[date];
        const totalAttendance = records.length;
        const presentCount = records.filter(r => r.status === 'present').length;
        const absentCount = records.filter(r => r.status === 'absent').length;
        const lateCount = records.filter(r => r.status === 'late').length;
        
        return {
          date,
          totalAttendance,
          presentCount,
          absentCount,
          lateCount,
          presentPercentage: totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : 0
        };
      });

      // Sort by date (oldest first)
      dailyTotals.sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        period,
        dailyTotals,
        summary: {
          totalRecords: attendanceData.length,
          totalPresent: attendanceData.filter(r => r.status === 'present').length,
          totalAbsent: attendanceData.filter(r => r.status === 'absent').length,
          totalLate: attendanceData.filter(r => r.status === 'late').length
        }
      });
    } catch (dbError) {
      console.error('Database error in attendance report:', dbError);
      // Return sample data as fallback
      res.json({
        period,
        dailyTotals: [],
        summary: {
          totalRecords: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0
        }
      });
    }
  } catch (err) {
    console.error('Error generating attendance report:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/courses
// @desc    Get course enrollment reports
// @access  Private (Admin)
router.get('/courses', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { department } = req.query;
    
    // Build query
    let whereClause = {};
    
    // Add department filter if provided
    if (department) {
      whereClause.department = department;
    }

    try {
      // Get courses with student counts
      const courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              students: true
            }
          },
          instructor: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Format response
      const courseData = courses.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        department: course.department,
        studentCount: course._count.students,
        instructor: course.instructor?.name || 'Not Assigned'
      }));

      // Calculate department-wise enrollment
      const departmentEnrollment = {};
      courseData.forEach(course => {
        if (!departmentEnrollment[course.department]) {
          departmentEnrollment[course.department] = {
            totalCourses: 0,
            totalStudents: 0
          };
        }
        departmentEnrollment[course.department].totalCourses++;
        departmentEnrollment[course.department].totalStudents += course.studentCount;
      });

      res.json({
        courses: courseData,
        departmentSummary: Object.entries(departmentEnrollment).map(([dept, data]) => ({
          department: dept,
          ...data,
          averageEnrollment: data.totalCourses ? Math.round(data.totalStudents / data.totalCourses) : 0
        })),
        totalCourses: courseData.length,
        totalEnrollments: courseData.reduce((sum, course) => sum + course.studentCount, 0)
      });
    } catch (dbError) {
      console.error('Database error in courses report:', dbError);
      // Return sample data as fallback
      res.json({
        courses: [],
        departmentSummary: [],
        totalCourses: 0,
        totalEnrollments: 0
      });
    }
  } catch (err) {
    console.error('Error generating course report:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/permissions
// @desc    Get permission request reports
// @access  Private (Admin)
router.get('/permissions', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const { period = 'month' } = req.query;
    
    // Get start date based on period
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    try {
      // Get permission data
      const permissions = await prisma.permission.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          user: {
            select: {
              name: true,
              department: true
            }
          },
          course: {
            select: {
              name: true,
              code: true,
              department: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Group by status
      const byStatus = {
        pending: permissions.filter(p => p.status === 'pending'),
        approved: permissions.filter(p => p.status === 'approved'),
        rejected: permissions.filter(p => p.status === 'rejected')
      };

      // Group by department
      const byDepartment = {};
      permissions.forEach(permission => {
        const dept = permission.user.department;
        if (!byDepartment[dept]) {
          byDepartment[dept] = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          };
        }
        byDepartment[dept].total++;
        byDepartment[dept][permission.status]++;
      });

      res.json({
        period,
        totalRequests: permissions.length,
        byStatus: {
          pending: byStatus.pending.length,
          approved: byStatus.approved.length,
          rejected: byStatus.rejected.length
        },
        byDepartment: Object.entries(byDepartment).map(([dept, counts]) => ({
          department: dept,
          ...counts,
          approvalRate: counts.total ? Math.round((counts.approved / counts.total) * 100) : 0
        })),
        recentRequests: permissions.slice(0, 10)
      });
    } catch (dbError) {
      console.error('Database error in permissions report:', dbError);
      // Return sample data as fallback
      res.json({
        period,
        totalRequests: 0,
        byStatus: {
          pending: 0,
          approved: 0,
          rejected: 0
        },
        byDepartment: [],
        recentRequests: []
      });
    }
  } catch (err) {
    console.error('Error generating permissions report:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 