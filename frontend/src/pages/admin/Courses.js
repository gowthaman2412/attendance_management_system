import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStudentsDialog, setOpenStudentsDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    credits: 3,
    instructor: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchStaff();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get( `${process.env.REACT_APP_API_BASE_URL}/api/courses`);
      setCourses(res.data);
      
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/staff/all`);
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/departments`);
      setDepartments(res.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCourse = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      credits: 3,
      instructor: ''
    });
    setOpenAddDialog(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      department: course.department?.id || course.department?.id || course.department || '',
      credits: course.credits || 3,
      instructor: course.instructor?.id || course.instructor?.id || course.instructorId || ''
    });
    setOpenEditDialog(true);
  };

  const handleDeleteCourse = (course) => {
    setSelectedCourse(course);
    setOpenDeleteDialog(true);
  };

  const handleViewStudents = (course) => {
    setSelectedCourse(course);
    setOpenStudentsDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenDeleteDialog(false);
    setOpenStudentsDialog(false);
    setSelectedCourse(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitAdd = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = { ...formData, department: formData.department };
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/courses`, payload);
      
      setSuccess('Course added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchCourses();
      
    } catch (err) {
      console.error('Error adding course:', err);
      setError(err.response?.data?.msg || 'Failed to add course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseId = selectedCourse.id || selectedCourse.id;
      const payload = { ...formData, department: formData.department };
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/courses/${courseId}`, payload);
      
      setSuccess('Course updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchCourses();
      
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.response?.data?.msg || 'Failed to update course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseId = selectedCourse.id || selectedCourse.id;
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/courses/${courseId}`);
      
      setSuccess('Course deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchCourses();
      
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.msg || 'Failed to delete course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = searchTerm === '' ? courses : (courses || []).filter(course => {
    return (
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Course Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
        >
          Add Course
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCourses.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id || course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department?.name || course.department || ''}</TableCell>
                  <TableCell>{course.instructor?.name || 'Not Assigned'}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${course.students?.length || 0} students`} 
                      color="primary" 
                      size="small"
                      onClick={() => handleViewStudents(course)}
                      icon={<PeopleIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditCourse(course)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No courses found.
          </Typography>
        </Paper>
      )}
      
      {/* Add Course Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  name="department"
                  value={formData.department}
                  label="Department"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credits"
                name="credits"
                type="number"
                value={formData.credits}
                onChange={handleFormChange}
                required
                InputProps={{ inputProps: { min: 1, max: 6 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="instructor-label">Instructor</InputLabel>
                <Select
                  labelId="instructor-label"
                  id="instructor"
                  name="instructor"
                  value={formData.instructor}
                  label="Instructor"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {staff.map((staffMember) => (
                    <MenuItem key={staffMember.id || staffMember.id} value={staffMember.id || staffMember.id}>
                      {staffMember.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAdd} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="department-edit-label">Department</InputLabel>
                <Select
                  labelId="department-edit-label"
                  id="department"
                  name="department"
                  value={formData.department}
                  label="Department"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credits"
                name="credits"
                type="number"
                value={formData.credits}
                onChange={handleFormChange}
                required
                InputProps={{ inputProps: { min: 1, max: 6 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="instructor-edit-label">Instructor</InputLabel>
                <Select
                  labelId="instructor-edit-label"
                  id="instructor"
                  name="instructor"
                  value={formData.instructor}
                  label="Instructor"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {staff.map((staffMember) => (
                    <MenuItem key={staffMember.id || staffMember.id} value={staffMember.id || staffMember.id}>
                      {staffMember.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
      >
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the course "{selectedCourse?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitDelete} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog
        open={openStudentsDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse?.name} - Enrolled Students
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse?.students?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCourse.students.map((student) => (
                    <TableRow key={student.id || student.id}>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.department}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
              No students enrolled in this course.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCourses;