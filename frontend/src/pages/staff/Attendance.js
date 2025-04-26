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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, /*Check as CheckIcon, Close as CloseIcon */} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const StaffAttendance = () => {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('class');
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/courses/staff');
        setCourses(res.data);
        
        // If classId is provided in URL, select that course
        if (classId) {
          const classData = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/courses/class/${classId}`);
          if (classData.data && classData.data.course) {
            setSelectedCourse(classData.data.course.id);
            setSelectedDate(new Date(classData.data.date).toISOString().split('T')[0]);
            fetchAttendance(classData.data.course.id, new Date(classData.data.date).toISOString().split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [classId]);

  const fetchAttendance = async (courseId, date) => {
    if (!courseId || !date) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/attendance/${courseId}/${date}`);
      
      // If no attendance records exist yet, create empty records for all students
      if (res.data.length === 0) {
        const courseRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/courses/${courseId}`);
        const students = courseRes.data.students || [];
        
        // Map students correctly for attendance UI
        const emptyAttendance = students.map(student => ({
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          id: student.id,
          department: student.department,
          status: 'absent',
          note: '',
          isEditing: false
        }));
        
        setAttendanceData(emptyAttendance);
      } else {
        const formattedData = res.data.map(record => ({
          ...record,
          isEditing: false
        }));
        setAttendanceData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    if (selectedDate) {
      fetchAttendance(e.target.value, selectedDate);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    if (selectedCourse) {
      fetchAttendance(selectedCourse, e.target.value);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(prevData => 
      prevData.map(record => 
        record?.studentId === studentId ? { ...record, status: newStatus } : record
      )
    );
  };

  const handleEditNote = (student) => {
    setCurrentStudent(student);
    setNote(student.note || '');
    setOpenNoteDialog(true);
  };

  const handleCloseNoteDialog = () => {
    setOpenNoteDialog(false);
    setCurrentStudent(null);
    setNote('');
  };

  const handleSaveNote = () => {
    setAttendanceData(prevData => 
      prevData.map(record => 
        record?.studentId === currentStudent.studentId ? { ...record, note } : record
      )
    );
    handleCloseNoteDialog();
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse || !selectedDate) {
      setError('Please select both course and date');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const attendancePayload = attendanceData.map(record => ({
        student: record.studentId,
        course: selectedCourse,
        date: selectedDate,
        status: record.status,
        note: record.note || ''
      }));
      
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/attendance/bulk`, { attendance: attendancePayload });
      
      setSuccess('Attendance saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to save attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'excused': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="course-select-label">Course</InputLabel>
              <Select
                labelId="course-select-label"
                id="course-select"
                value={selectedCourse}
                label="Course"
                onChange={handleCourseChange}
                disabled={loading}
              >
                <MenuItem value=""><em>Select a course</em></MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              id="date-select"
              label="Date"
              type="date"
              fullWidth
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveAttendance}
              disabled={loading || !selectedCourse || !selectedDate || attendanceData.length === 0}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Save Attendance'}
            </Button>
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
      
      {selectedCourse && selectedDate ? (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : attendanceData.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.studentId || '-'}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {['present', 'late', 'absent', 'excused'].map((status) => (
                          <Chip
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            color={record.status === status ? getStatusColor(status) : 'default'}
                            variant={record.status === status ? 'filled' : 'outlined'}
                            onClick={() => handleStatusChange(record.studentId, status)}
                            clickable
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {record.note ? record.note.substring(0, 30) + (record.note.length > 30 ? '...' : '') : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditNote(record)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No students found for this course.
            </Typography>
          </Paper>
        )
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Please select a course and date to view or record attendance.
          </Typography>
        </Paper>
      )}
      
      {/* Note Dialog */}
      <Dialog open={openNoteDialog} onClose={handleCloseNoteDialog}>
        <DialogTitle>
          Add Note for {currentStudent?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNote} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffAttendance;