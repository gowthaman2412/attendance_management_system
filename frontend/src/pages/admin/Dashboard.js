import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
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

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPermissions, setRecentPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch system statistics
        const statsRes = await api.get('/api/analytics/stats');
        setStats(statsRes.data);
        
        // Fetch recent users
        const usersRes = await api.get('/api/users/recent');
        setRecentUsers(usersRes.data);
        
        // Fetch recent permission requests
        const permissionsRes = await api.get('/api/permissions/recent');
        setRecentPermissions(permissionsRes.data);
        
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
      
      {/* System Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h3" color="primary">
              {stats?.totalStudents || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Students
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h3" color="primary">
              {stats?.totalStaff || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Staff
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h3" color="primary">
              {stats?.totalCourses || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Courses
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h3" color="primary">
              {stats?.pendingPermissions || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Pending Permissions
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recently Registered Users
            </Typography>
            {recentUsers.length > 0 ? (
              <List>
                {recentUsers.map(user => (
                  <React.Fragment key={user.id || user.id}>
                    <ListItem>
                      <ListItemText 
                        primary={user.name} 
                        secondary={`${user.email} - ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent user registrations
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" href="/admin/users">
                View All Users
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Permission Requests */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Permission Requests
            </Typography>
            {recentPermissions.length > 0 ? (
              <List>
                {recentPermissions.map((permission) => (
                  <React.Fragment key={permission.id || permission.id}>
                    <ListItem>
                      <ListItemText 
                        primary={`${permission.user?.name || permission.student?.name} - ${permission.type}`} 
                        secondary={`Status: ${permission.status.charAt(0).toUpperCase() + permission.status.slice(1)} | ${new Date(permission.createdAt).toLocaleDateString()}`} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent permission requests
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* System Overview */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Attendance Statistics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present: {stats?.attendanceStats?.present || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late: {stats?.attendanceStats?.late || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent: {stats?.attendanceStats?.absent || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Excused: {stats?.attendanceStats?.excused || 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Department Distribution
                    </Typography>
                    {stats?.departmentStats ? (
                      Object.entries(stats.departmentStats).map(([dept, count]) => (
                        <Typography key={dept} variant="body2" color="text.secondary">
                          {dept}: {count} students
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No department data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      System Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Server Status: {stats?.systemStatus?.server || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Database Status: {stats?.systemStatus?.database || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Backup: {stats?.systemStatus?.lastBackup || 'Never'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Version: {stats?.systemStatus?.version || '1.0.0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" href="/admin/reports">
                View Detailed Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;