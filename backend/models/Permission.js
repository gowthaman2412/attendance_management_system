const prisma = require('../prisma/client');

// Get all permissions
async function getAllPermissions() {
  return prisma.permission.findMany({
    include: {
      user: true,
      course: true,
      reviewer: true
    }
  });
}

// Get permission by ID
async function getPermissionById(id) {
  return prisma.permission.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: true,
      course: true,
      reviewer: true
    }
  });
}

// Get permissions by user ID
async function getPermissionsByUser(userId) {
  return prisma.permission.findMany({
    where: { userId: parseInt(userId) },
    include: {
      user: true,
      course: true,
      reviewer: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Get permissions by course ID
async function getPermissionsByCourse(courseId) {
  return prisma.permission.findMany({
    where: { courseId: parseInt(courseId) },
    include: {
      user: true,
      course: true,
      reviewer: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Get permissions by status
async function getPermissionsByStatus(status) {
  return prisma.permission.findMany({
    where: { status },
    include: {
      user: true,
      course: true,
      reviewer: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Create a new permission
async function createPermission(data) {
  return prisma.permission.create({
    data: {
      type: data.type,
      reason: data.reason,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status || 'pending',
      reviewNotes: data.reviewNotes,
      attachments: data.attachments,
      user: {
        connect: { id: parseInt(data.userId) }
      },
      course: {
        connect: { id: parseInt(data.courseId) }
      },
      reviewer: data.reviewedById ? {
        connect: { id: parseInt(data.reviewedById) }
      } : undefined,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined
    },
    include: {
      user: true,
      course: true,
      reviewer: true
    }
  });
}

// Update a permission
async function updatePermission(id, data) {
  const updateData = { ...data };
  
  // Handle dates
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.reviewDate) updateData.reviewDate = new Date(data.reviewDate);
  
  // Handle relations
  if (data.userId) {
    updateData.user = { connect: { id: parseInt(data.userId) } };
    delete updateData.userId;
  }
  
  if (data.courseId) {
    updateData.course = { connect: { id: parseInt(data.courseId) } };
    delete updateData.courseId;
  }
  
  if (data.reviewedById) {
    updateData.reviewer = { connect: { id: parseInt(data.reviewedById) } };
    delete updateData.reviewedById;
  }
  
  return prisma.permission.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      user: true,
      course: true,
      reviewer: true
    }
  });
}

// Delete a permission
async function deletePermission(id) {
  return prisma.permission.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  getAllPermissions,
  getPermissionById,
  getPermissionsByUser,
  getPermissionsByCourse,
  getPermissionsByStatus,
  createPermission,
  updatePermission,
  deletePermission
};