import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import api from '../../api';

const StudentAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    total: 0
  });

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student's courses
        const coursesRes = await api.get(`${process.env.REACT_APP_API_BASE_URL}/api/courses/student`);
        setCourses(coursesRes.data);
        
        // Fetch attendance records
        const url = selectedCourse === 'all' 
          ? `${process.env.REACT_APP_API_BASE_URL}/api/attendance/student`
          : `${process.env.REACT_APP_API_BASE_URL}/api/attendance/student?courseId=${selectedCourse}`;
          
        const attendanceRes = await api.get(url);
        setAttendanceRecords(attendanceRes.data);
        
        // Calculate statistics
        const records = attendanceRes.data;
        const total = records.length;
        const present = records.filter(record => record.status === 'present').length;
        const late = records.filter(record => record.status === 'late').length;
        const absent = records.filter(record => record.status === 'absent').length;
        const excused = records.filter(record => record.status === 'excused').length;
        
        setStats({
          present,
          late,
          absent,
          excused,
          total
        });
        
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [selectedCourse]);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'present':
        return <Chip label="Present" color="success" size="small" />;
      case 'late':
        return <Chip label="Late" color="warning" size="small" />;
      case 'absent':
        return <Chip label="Absent" color="error" size="small" />;
      case 'excused':
        return <Chip label="Excused" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Records
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <FormControl fullWidth>
            <InputLabel id="course-select-label">Filter by Course</InputLabel>
            <Select
              labelId="course-select-label"
              id="course-select"
              value={selectedCourse}
              label="Filter by Course"
              onChange={handleCourseChange}
            >
              <MenuItem value="all">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {stats.present}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Present
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {stats.late}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Late
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {stats.absent}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Absent
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {stats.excused}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Excused
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              {/* <TableCell>Location</TableCell> */}
              <TableCell>Marked By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((record) => (
                <TableRow key={record?.id}>
                  <TableCell>{new Date(record?.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record?.course?.name} ({record?.course?.code})</TableCell>
                  <TableCell>{record?.startTime} - {record?.endTime}</TableCell>
                  <TableCell>{getStatusChip(record?.status)}</TableCell>
                  <TableCell>{record?.name || '-'}</TableCell>
                  <TableCell>{record?.markedBy?.name}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No attendance records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default StudentAttendance;