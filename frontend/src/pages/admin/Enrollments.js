import React, { useState, useEffect } from 'react';
import { Table, Grid, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from '@mui/material';
import api from '../../api';

const Enrollments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [courseCode, setCourseCode] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/enrollments');
      setData(res.data.map(item => ({ ...item, key: item.id })));
    } catch (err) {
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnrollment = async (values) => {
    try {
      await api.post('/api/enrollments', values);
      setSuccess(true);
      fetchEnrollments();
    } catch (err) {
      setError('Failed to add enrollment: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h1>Manage Enrollments</h1>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Student ID"
            name="studentId"
            required
            variant="outlined"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Course Code"
            name="courseCode"
            required
            variant="outlined"
            value={courseCode}
            onChange={e => setCourseCode(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            size="large"
            onClick={async () => {
              if (!studentId.trim() || !courseCode.trim()) return;
              await handleAddEnrollment({ studentId: parseInt(studentId), courseCode: courseCode.trim() });
              setStudentId('');
              setCourseCode('');
            }}
          >
            Add Enrollment
          </Button>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Course Code</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row?.user?.studentId}</TableCell>
                <TableCell>{row?.course ? row?.course?.code : ''}</TableCell>
                <TableCell>
                  <Button>Edit</Button>
                  <Button>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Enrollments;