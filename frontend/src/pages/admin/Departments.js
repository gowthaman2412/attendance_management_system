import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import api from '../../api';
import { Grid, TextField } from '@mui/material';

const Departments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/departments');
      setData(res.data.map(item => ({ ...item, key: item.id })));
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (values) => {
    try {
      await api.post('/api/departments', values);
      setSuccess(true);
      fetchDepartments();
    } catch (err) {
      setError('Failed to add department: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h1>Manage Departments</h1>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Department Name"
            name="departmentName"
            required
            variant="outlined"
            value={departmentName}
            onChange={e => setDepartmentName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            size="large"
            onClick={async () => {
              if (!departmentName.trim()) return;
              await handleAddDepartment({ name: departmentName, code: departmentName.replace(/\s+/g, '-').toLowerCase() });
              setDepartmentName('');
            }}
          >
            Add Department
          </Button>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
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

export default Departments;