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
  Alert,
  Button
} from '@mui/material';
import useAuthStore from '../../store/authStore';
import api from '../../api';

const StaffDashboard = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pendingPermissions, setPendingPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch staff's courses
        const coursesRes = await api.get('/api/courses/staff');
        setCourses(coursesRes.data);
        
        // Fetch upcoming classes
        const classesRes = await api.get('/api/courses/upcoming');
        setUpcomingClasses(classesRes.data);
        
        // Fetch pending permissions
        const permissionsRes = await api.get('/api/permissions/pending');
        setPendingPermissions(permissionsRes.data);
        
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
        {/* My Courses */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              My Courses
            </Typography>
            {courses.length > 0 ? (
              <List>
                {courses.slice(0, 5).map((course) => (
                  <React.Fragment key={course.id}>
                    <ListItem>
                      <ListItemText 
                        primary={course.name} 
                        secondary={`${course.code} - ${course.students?.length || 0} students enrolled`} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                You are not assigned to any courses
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" href="/staff/courses">
                View All Courses
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Pending Permissions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Pending Permission Requests
            </Typography>
            {pendingPermissions.length > 0 ? (
              <List>
                {pendingPermissions.slice(0, 5).map((permission) => (
                  <React.Fragment key={permission.id}>
                    <ListItem>
                      <ListItemText 
                        primary={`${permission.student?.name} - ${permission.type}`} 
                        secondary={`Reason: ${permission.reason} (${new Date(permission.date).toLocaleDateString()})`} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No pending permission requests
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" href="/staff/permissions">
                View All Permissions
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Upcoming Classes */}
        {/* <Grid item xs={12}>
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
                        <Typography variant="body2" color="text.secondary">
                          Students: {classItem.course.students?.length || 0}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button size="small" variant="contained" href={`/staff/attendance?class=${classItem.id}`}>
                            Take Attendance
                          </Button>
                        </Box>
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
        </Grid> */}
      </Grid>
    </Container>
  );
};

export default StaffDashboard;