import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import useAuthStore from '../../store/authStore';
import api from '../../api';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student's courses
        const coursesRes = await api.get('/api/courses/student');
        setCourses(coursesRes.data);
        
        // Fetch attendance summary
        const attendanceRes = await api.get('/api/attendance/summary');
        setAttendanceSummary(attendanceRes.data);
        
        // Fetch upcoming classes
        const classesRes = await api.get('/api/courses/upcoming');
        setUpcomingClasses(classesRes.data);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
        Welcome, {user?.name}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Attendance Summary */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Attendance Summary
            </Typography>
            {attendanceSummary ? (
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {attendanceSummary.presentPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Present
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {attendanceSummary.latePercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Late
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {attendanceSummary.absentPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Absent
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No attendance data available
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Enrolled Courses */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Enrolled Courses
            </Typography>
            {courses.length > 0 ? (
              <List>
                {courses.slice(0, 5).map((course) => (
                  <React.Fragment key={course.id}>
                    <ListItem>
                      <ListItemText 
                        primary={course.name} 
                        secondary={`${course.code} - ${course.instructor?.name || 'TBA'}`} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                You are not enrolled in any courses
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Upcoming Classes */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Classes
            </Typography>
            {upcomingClasses.length > 0 ? (
              <Grid container spacing={2}>
                {upcomingClasses.map((classItem) => (
                  <Grid item xs={12} sm={6} md={4} key={classItem.id}>
                    <Card variant="outlined">
                      <CardHeader
                        title={classItem.course.name}
                        subheader={classItem.course.code}
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(classItem.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Time: {classItem.startTime} - {classItem.endTime}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {classItem.location.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No upcoming classes
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;