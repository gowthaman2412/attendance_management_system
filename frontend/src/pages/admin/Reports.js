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
  TextField
} from '@mui/material';
import axios from 'axios';

const AdminReports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceFilters, setAttendanceFilters] = useState({ department: '', course: '', startDate: '', endDate: '' });
  const [permissionFilters, setPermissionFilters] = useState({ department: '', course: '', startDate: '', endDate: '' });
  const [courseFilters, setCourseFilters] = useState({ department: '' });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (attendanceFilters.department) params.department = attendanceFilters.department;
      if (attendanceFilters.course) params.course = attendanceFilters.course;
      if (attendanceFilters.startDate) params.startDate = attendanceFilters.startDate;
      if (attendanceFilters.endDate) params.endDate = attendanceFilters.endDate;
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
      if (courseFilters.department) params.department = courseFilters.department;
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
      if (permissionFilters.department) params.department = permissionFilters.department;
      if (permissionFilters.course) params.course = permissionFilters.course;
      if (permissionFilters.startDate) params.startDate = permissionFilters.startDate;
      if (permissionFilters.endDate) params.endDate = permissionFilters.endDate;
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

  const handleAttendanceFilterChange = (e) => {
    const { name, value } = e.target;
    setAttendanceFilters({ ...attendanceFilters, [name]: value });
  };

  const handlePermissionFilterChange = (e) => {
    const { name, value } = e.target;
    setPermissionFilters({ ...permissionFilters, [name]: value });
  };

  const handleCourseFilterChange = (e) => {
    const { name, value } = e.target;
    setCourseFilters({ ...courseFilters, [name]: value });
  };

  const renderAttendanceReport = () => {
    if (!reportData) return null;

    const { overallStats, courseStats } = reportData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Overall Attendance</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Present</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{overallStats?.present || 0}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Late</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{overallStats?.late || 0}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Absent</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{overallStats?.absent || 0}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Excused</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{overallStats?.excused || 0}</td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Attendance by Course</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Course</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Present</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Late</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Absent</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Excused</th>
                </tr>
              </thead>
              <tbody>
                {courseStats?.map((course, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{course.code}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{course.present}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{course.late}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{course.absent}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{course.excused}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderCourseReport = () => {
    if (!reportData) return null;

    const { enrollmentStats } = reportData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Enrollment by Department</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Department</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Students</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentStats?.map((dept, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{dept.name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{dept.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderPermissionReport = () => {
    if (!reportData) return null;

    const { permissionStats } = reportData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Permission Status</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Approved</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{permissionStats?.approved || 0}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Pending</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{permissionStats?.pending || 0}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Rejected</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{permissionStats?.rejected || 0}</td>
                </tr>
              </tbody>
            </table>
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
        {/* <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => alert('Export functionality would be implemented here')}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box> */}
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
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        labelId="department-label"
                        id="department"
                        name="department"
                        value={attendanceFilters.department}
                        label="Department"
                        onChange={handleAttendanceFilterChange}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="course-label">Course</InputLabel>
                      <Select
                        labelId="course-label"
                        id="course"
                        name="course"
                        value={attendanceFilters.course}
                        label="Course"
                        onChange={handleAttendanceFilterChange}
                      >
                        <MenuItem value="">All Courses</MenuItem>
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>{course.name} ({course.code})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      id="startDate"
                      label="Start Date"
                      type="date"
                      name="startDate"
                      value={attendanceFilters.startDate}
                      onChange={handleAttendanceFilterChange}
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
                      value={attendanceFilters.endDate}
                      onChange={handleAttendanceFilterChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                      <Button variant="contained" onClick={fetchAttendanceReport} fullWidth sx={{ height: '56px' }}>Apply</Button>
                      <Button variant="outlined" onClick={() => setAttendanceFilters({ department: '', course: '', startDate: '', endDate: '' })} fullWidth sx={{ height: '56px' }}>Reset</Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
              {tabValue === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        labelId="department-label"
                        id="department"
                        name="department"
                        value={courseFilters.department}
                        label="Department"
                        onChange={handleCourseFilterChange}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                      <Button variant="contained" onClick={fetchCourseReport} fullWidth sx={{ height: '56px' }}>Apply</Button>
                      <Button variant="outlined" onClick={() => setCourseFilters({ department: '' })} fullWidth sx={{ height: '56px' }}>Reset</Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
              {tabValue === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        labelId="department-label"
                        id="department"
                        name="department"
                        value={permissionFilters.department}
                        label="Department"
                        onChange={handlePermissionFilterChange}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="course-label">Course</InputLabel>
                      <Select
                        labelId="course-label"
                        id="course"
                        name="course"
                        value={permissionFilters.course}
                        label="Course"
                        onChange={handlePermissionFilterChange}
                      >
                        <MenuItem value="">All Courses</MenuItem>
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>{course.name} ({course.code})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      id="startDate"
                      label="Start Date"
                      type="date"
                      name="startDate"
                      value={permissionFilters.startDate}
                      onChange={handlePermissionFilterChange}
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
                      value={permissionFilters.endDate}
                      onChange={handlePermissionFilterChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                      <Button variant="contained" onClick={fetchPermissionReport} fullWidth sx={{ height: '56px' }}>Apply</Button>
                      <Button variant="outlined" onClick={() => setPermissionFilters({ department: '', course: '', startDate: '', endDate: '' })} fullWidth sx={{ height: '56px' }}>Reset</Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
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