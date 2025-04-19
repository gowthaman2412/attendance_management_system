const prisma = require('../prisma/client');

// Get all courses
async function getAllCourses() {
  return prisma.course.findMany({
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Get course by ID
async function getCourseById(id) {
  return prisma.course.findUnique({
    where: { id: parseInt(id) },
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Get course by code
async function getCourseByCode(code) {
  return prisma.course.findUnique({
    where: { code },
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Get courses by instructor
async function getCoursesByInstructor(instructorId) {
  return prisma.course.findMany({
    where: { instructorId: parseInt(instructorId) },
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Get courses by student
async function getCoursesByStudent(studentId) {
  return prisma.course.findMany({
    where: {
      students: {
        some: {
          userId: parseInt(studentId)
        }
      }
    },
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Create a new course
async function createCourse(data) {
  return prisma.course.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      department: data.department,
      semester: data.semester,
      year: data.year,
      active: data.active !== undefined ? data.active : true,
      instructor: {
        connect: { id: parseInt(data.instructorId) }
      },
      schedules: {
        create: data.schedules?.map(schedule => ({
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          building: schedule.location.building,
          room: schedule.location.room,
          locationCoordinates: {
            longitude: schedule.location.coordinates[0],
            latitude: schedule.location.coordinates[1]
          }
        })) || []
      }
    },
    include: {
      instructor: true,
      schedules: true
    }
  });
}

// Update a course
async function updateCourse(id, data) {
  const updateData = { ...data };
  
  // Handle relations
  if (data.instructorId) {
    updateData.instructor = { connect: { id: parseInt(data.instructorId) } };
    delete updateData.instructorId;
  }
  
  // Handle schedules separately
  if (data.schedules) {
    // First delete existing schedules
    await prisma.courseSchedule.deleteMany({
      where: { courseId: parseInt(id) }
    });
    
    // Then create new ones
    updateData.schedules = {
      create: data.schedules.map(schedule => ({
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        building: schedule.location.building,
        room: schedule.location.room,
        locationCoordinates: {
          longitude: schedule.location.coordinates[0],
          latitude: schedule.location.coordinates[1]
        }
      }))
    };
  }
  
  return prisma.course.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      instructor: true,
      students: {
        include: {
          user: true
        }
      },
      schedules: true
    }
  });
}

// Add student to course
async function addStudentToCourse(courseId, userId) {
  return prisma.courseStudent.create({
    data: {
      course: { connect: { id: parseInt(courseId) } },
      user: { connect: { id: parseInt(userId) } }
    }
  });
}

// Remove student from course
async function removeStudentFromCourse(courseId, userId) {
  return prisma.courseStudent.delete({
    where: {
      courseId_userId: {
        courseId: parseInt(courseId),
        userId: parseInt(userId)
      }
    }
  });
}

// Delete a course
async function deleteCourse(id) {
  // First delete related schedules
  await prisma.courseSchedule.deleteMany({
    where: { courseId: parseInt(id) }
  });
  
  // Then delete course-student relationships
  await prisma.courseStudent.deleteMany({
    where: { courseId: parseInt(id) }
  });
  
  // Finally delete the course
  return prisma.course.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  getCoursesByInstructor,
  getCoursesByStudent,
  createCourse,
  updateCourse,
  addStudentToCourse,
  removeStudentFromCourse,
  deleteCourse
};