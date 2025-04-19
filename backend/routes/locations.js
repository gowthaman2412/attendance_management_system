const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../prisma/client');

// @route   GET api/locations/nearby-classes
// @desc    Get nearby classes for a student
// @access  Private
router.get('/nearby-classes', auth, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can access this endpoint' });
    }

    // Validate request parameters
    const { longitude, latitude, maxDistance = 100 } = req.query;
    if (!longitude || !latitude) {
      return res.status(400).json({ msg: 'Location coordinates are required' });
    }

    // Parse coordinates to numbers
    const userLong = parseFloat(longitude);
    const userLat = parseFloat(latitude);
    const maxDist = parseInt(maxDistance);

    // Get current day and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayString = daysOfWeek[currentDay];
    
    // Get current time in hours and minutes
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Get all enrolled courses for this user
    const enrolledCourses = await prisma.courseStudent.findMany({
      where: { 
        userId: parseInt(req.user.id)
      },
      include: {
        course: {
          include: {
            schedule: true
          }
        }
      }
    });

    // Filter to find classes that are happening today
    const todaysClasses = [];
    
    for (const enrollment of enrolledCourses) {
      const course = enrollment.course;
      
      // Check if the course has schedule entries for today
      const todaySchedule = course.schedule.filter(entry => 
        entry.day.toLowerCase() === currentDayString
      );
      
      if (todaySchedule.length > 0) {
        for (const schedule of todaySchedule) {
          // Parse class times
          const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          
          const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
          const endTimeInMinutes = endHour * 60 + endMinute;
          
          // Check if class is ongoing or upcoming (within next 30 mins)
          const isOngoing = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
          const isUpcoming = currentTimeInMinutes < startTimeInMinutes && (startTimeInMinutes - currentTimeInMinutes) <= 30;
          
          if (isOngoing || isUpcoming) {
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
              userLat, userLong,
              schedule.latitude, schedule.longitude
            );
            
            // Only include if within max distance
            if (distance <= maxDist) {
              todaysClasses.push({
                id: course.id,
                name: course.name,
                code: course.code,
                building: schedule.building,
                room: schedule.room,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                distance: Math.round(distance),
                status: isOngoing ? 'ongoing' : 'upcoming',
                location: {
                  longitude: schedule.longitude,
                  latitude: schedule.latitude
                }
              });
            }
          }
        }
      }
    }
    
    // Sort by distance (closest first)
    todaysClasses.sort((a, b) => a.distance - b.distance);
    
    res.json(todaysClasses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/locations/course/:courseId
// @desc    Get location for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    let userHasAccess = false;
    
    if (req.user.role === 'admin') {
      userHasAccess = true;
    } else if (req.user.role === 'staff') {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
      });
      
      if (course && course.instructorId === parseInt(req.user.id)) {
        userHasAccess = true;
      }
    } else if (req.user.role === 'student') {
      const enrollment = await prisma.courseStudent.findFirst({
        where: {
          courseId: parseInt(courseId),
          userId: parseInt(req.user.id)
        }
      });
      
      if (enrollment) {
        userHasAccess = true;
      }
    }
    
    if (!userHasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this course' });
    }
    
    // Get course schedule with location info
    const courseSchedule = await prisma.courseSchedule.findMany({
      where: { courseId: parseInt(courseId) }
    });
    
    if (!courseSchedule || courseSchedule.length === 0) {
      return res.status(404).json({ msg: 'No location information found for this course' });
    }
    
    res.json(courseSchedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/locations/buildings
// @desc    Get all buildings with coordinates
// @access  Private
router.get('/buildings', auth, async (req, res) => {
  try {
    // Get all course schedules
    const schedules = await prisma.courseSchedule.findMany({
      select: {
        building: true,
        latitude: true,
        longitude: true
      }
    });
    
    // Create a map of buildings with their coordinates
    const buildingsMap = {};
    
    schedules.forEach(schedule => {
      if (
        schedule.building && 
        schedule.latitude && 
        schedule.longitude &&
        !buildingsMap[schedule.building]
      ) {
        buildingsMap[schedule.building] = {
          name: schedule.building,
          latitude: schedule.latitude,
          longitude: schedule.longitude
        };
      }
    });
    
    // Convert map to array
    const buildings = Object.values(buildingsMap);
    
    // Sort alphabetically by building name
    buildings.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(buildings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;

  return d;
}

// Convert time string (HH:MM) to minutes since midnight
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;