const prisma = require('../prisma/client');

// Export functions for working with Attendance records
async function createAttendance(data) {
  return prisma.attendance.create({
    data,
    include: {
      user: true,
      course: true,
      verifier: true
    }
  });
}

async function getAttendanceById(id) {
  return prisma.attendance.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: true,
      course: true,
      verifier: true
    }
  });
}

async function getAttendanceByUserAndCourse(userId, courseId) {
  return prisma.attendance.findMany({
    where: {
      userId: parseInt(userId),
      courseId: parseInt(courseId)
    },
    orderBy: {
      date: 'desc'
    },
    include: {
      user: true,
      course: true,
      verifier: true
    }
  });
}

async function updateAttendance(id, data) {
  return prisma.attendance.update({
    where: { id: parseInt(id) },
    data,
    include: {
      user: true,
      course: true,
      verifier: true
    }
  });
}

async function deleteAttendance(id) {
  return prisma.attendance.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  createAttendance,
  getAttendanceById,
  getAttendanceByUserAndCourse,
  updateAttendance,
  deleteAttendance
};