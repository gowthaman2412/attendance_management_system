import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import axios from 'axios';

const AdminReports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    course: '',
    startDate: '',
    endDate: ''
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchDepartmentsAndCourses();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      fetchAttendanceReport();
    } else if (tabValue === 1) {
      fetchCourseReport();
    } else if (tabValue === 2) {
      fetchPermissionReport();
    }
  }, [tabValue]);

  const fetchDepartmentsAndCourses = async () => {
    try {
      const deptRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/departments`);
      setDepartments(deptRes.data);

      const coursesRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/courses`);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.course) params.course = filters.course;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reports/attendance`, { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching attendance report:', err);
      setError('Failed to load attendance report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.department) params.department = filters.department;
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reports/courses`, { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching course report:', err);
      setError('Failed to load course report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reports/permissions`, { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching permission report:', err);
      setError('Failed to load permission report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleApplyFilters = () => {
    if (tabValue === 0) {
      fetchAttendanceReport();
    } else if (tabValue === 1) {
      fetchCourseReport();
    } else if (tabValue === 2) {
      fetchPermissionReport();
    }
  };

  const handleResetFilters = () => {
    setFilters({
      department: '',
      course: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleExportReport = () => {
    // In a real application, this would generate a CSV or PDF file
    alert('Export functionality would be implemented here');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const renderAttendanceReport = () => {
    if (!reportData) return null;

    const { overallStats, courseStats, departmentStats, dateStats } = reportData;

    const pieData = [
      { name: 'Present', value: overallStats?.present || 0 },
      { name: 'Late', value: overallStats?.late || 0 },
      { name: 'Absent', value: overallStats?.absent || 0 },
      { name: 'Excused', value: overallStats?.excused || 0 }
    ];

    const barData = courseStats?.map(course => ({
      name: course.code,
      present: course.present,
      late: course.late,
      absent: course.absent,
      excused: course.excused
    })) || [];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Overall Attendance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Attendance by Course</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#00C49F" name="Present" />
                <Bar dataKey="late" fill="#FFBB28" name="Late" />
                <Bar dataKey="absent" fill="#FF8042" name="Absent" />
                <Bar dataKey="excused" fill="#8884d8" name="Excused" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Attendance Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Department Statistics</Typography>
                    <List dense>
                      {departmentStats?.map((dept, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={dept.name}
                            secondary={`Present: ${dept.present}%, Absent: ${dept.absent}%`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Date Trends</Typography>
                    <List dense>
                      {dateStats?.map((date, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={new Date(date.date).toLocaleDateString()}
                            secondary={`Attendance Rate: ${date.attendanceRate}%`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderCourseReport = () => {
    if (!reportData) return null;

    const { enrollmentStats, coursePerformance, instructorStats } = reportData;

    const enrollmentData = enrollmentStats?.map(dept => ({
      name: dept.name,
      students: dept.studentCount
    })) || [];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Enrollment by Department</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8884d8" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Course Performance</Typography>
            <List>
              {coursePerformance?.map((course, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${course.name} (${course.code})`}
                    secondary={`Students: ${course.studentCount} | Avg. Attendance: ${course.avgAttendance}%`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Instructor Statistics</Typography>
            <Grid container spacing={2}>
              {instructorStats?.map((instructor, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">{instructor.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Courses: {instructor.courseCount} | Students: {instructor.studentCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderPermissionReport = () => {
    if (!reportData) return null;

    const { permissionStats, typeStats, departmentStats } = reportData;

    const pieData = [
      { name: 'Approved', value: permissionStats?.approved || 0 },
      { name: 'Pending', value: permissionStats?.pending || 0 },
      { name: 'Rejected', value: permissionStats?.rejected || 0 }
    ];

    const barData = typeStats?.map(type => ({
      name: type.type,
      count: type.count
    })) || [];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Permission Status Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Permission Types</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Department Permission Statistics</Typography>
            <Grid container spacing={2}>
              {departmentStats?.map((dept, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">{dept.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved: {dept.approved} | Pending: {dept.pending} | Rejected: {dept.rejected}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintReport}
          >
            Print
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
              <Tab label="Attendance Report" />
              <Tab label="Course Report" />
              <Tab label="Permission Report" />
            </Tabs>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="department-label">Department</InputLabel>
                    <Select
                      labelId="department-label"
                      id="department"
                      name="department"
                      value={filters.department}
                      label="Department"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {tabValue !== 1 && (
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="course-label">Course</InputLabel>
                      <Select
                        labelId="course-label"
                        id="course"
                        name="course"
                        value={filters.course}
                        label="Course"
                        onChange={handleFilterChange}
                        disabled={tabValue === 2}
                      >
                        <MenuItem value="">All Courses</MenuItem>
                        {courses.map((course) => (
                          <MenuItem key={course._id} value={course._id}>
                            {course.name} ({course.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {tabValue !== 1 && (
                  <>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        id="startDate"
                        label="Start Date"
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        id="endDate"
                        label="End Date"
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleResetFilters}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && renderAttendanceReport()}
          {tabValue === 1 && renderCourseReport()}
          {tabValue === 2 && renderPermissionReport()}
        </Box>
      )}
    </Container>
  );
};

export default AdminReports;