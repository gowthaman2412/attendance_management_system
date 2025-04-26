const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/settings
// @desc    Get system settings
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      const defaultSettings = await prisma.settings.create({
        data: {
          attendanceCheckInWindow: 15,
          attendanceGeoFencingRadius: 100,
          attendanceRequirePhoto: false,
          systemTheme: 'light',
          systemName: 'Attendance Management System',
          academicYear: '',
          semester: '',
          defaultAttendanceStatus: 'absent',
          maintenanceMode: false
        }
      });
      res.json(defaultSettings);
    } else {
      res.json(settings);
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/settings
// @desc    Update system settings
// @access  Private (Admin)
router.put('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const updatedSettings = await prisma.settings.update({
      where: { id: 1 },
      data: {
        attendanceCheckInWindow: parseInt(req.body.attendanceCheckInWindow),
        attendanceGeoFencingRadius: parseInt(req.body.attendanceGeoFencingRadius),
        attendanceRequirePhoto: req.body.attendanceRequirePhoto === true || req.body.attendanceRequirePhoto === 'true',
        systemTheme: req.body.systemTheme,
        systemName: req.body.systemName,
        academicYear: req.body.academicYear,
        semester: req.body.semester,
        defaultAttendanceStatus: req.body.defaultAttendanceStatus,
        maintenanceMode: req.body.maintenanceMode === true || req.body.maintenanceMode === 'true'
      }
    });
    res.json({ msg: 'Settings updated successfully', settings: updatedSettings });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/settings/system-info
// @desc    Get system information
// @access  Private (Admin)
router.get('/system-info', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    const [totalUsers, totalCourses] = await Promise.all([
      prisma.user.count(),
      prisma.course.count()
    ]);
    let diskSpace = 'N/A';
    try {
      const os = require('os');
      const total = os.totalmem() / (1024 * 1024 * 1024);
      const free = os.freemem() / (1024 * 1024 * 1024);
      const used = total - free;
      diskSpace = `${used.toFixed(1)} GB / ${total.toFixed(1)} GB (${((used/total)*100).toFixed(0)}%)`;
    } catch (e) {}
    const systemInfo = {
      version: '1.0.0',
      serverUptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'development',
      database: {
        provider: 'PostgreSQL',
        version: 'Latest'
      },
      serverStatus: 'running',
      databaseStatus: await prisma.$queryRaw`SELECT 1` ? 'connected' : 'disconnected',
      totalUsers,
      totalCourses,
      diskSpace
    };
    res.json(systemInfo);
  } catch (err) {
    console.error('Error fetching system info:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;