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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../../api';

const StudentPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    document: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student's permission requests
        const permissionsRes = await api.get(`${process.env.REACT_APP_API_BASE_URL}/api/permissions/student`);
        setPermissions(permissionsRes.data);
        // Fetch student's courses for the form
        const coursesRes = await api.get(`${process.env.REACT_APP_API_BASE_URL}/api/courses/student`);
        setCourses(coursesRes.data);
        
      } catch (err) {
        console.error('Error fetching permissions data:', err);
        setError('Failed to load permissions data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      course: '',
      type: '',
      startDate: '',
      endDate: '',
      reason: '',
      document: null
    });
    setFormError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      document: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.course || !formData.type || !formData.startDate || !formData.endDate || !formData.reason) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setFormError(null);
      
      // Send as JSON payload
      const payload = {
        course: formData.course,
        type: formData.type,
        reason: formData.reason,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      // Optionally handle document upload separately if needed
      const res = await api.post('/api/permissions', payload);
      
      // Add new permission to the list
      setPermissions([res.data, ...permissions]);
      
      // Close dialog
      handleCloseDialog();
      
    } catch (err) {
      console.error('Error submitting permission request:', err);
      setFormError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'absence':
        return 'Absence';
      case 'late':
        return 'Late Arrival';
      case 'early-leave':
        return 'Early Departure';
      default:
        return type;
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
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" gutterBottom>
            Permission Requests
          </Typography>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Request
          </Button>
        </Grid>
      </Grid>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted On</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{ (permission?.startDate!=permission?.endDate) ? (`${formatDate(permission?.startDate)} to ${formatDate(permission?.endDate)}`) : (`${formatDate(permission?.endDate)}`) }</TableCell>
                  <TableCell>{permission.course.name} ({permission.course.code})</TableCell>
                  <TableCell>{getTypeLabel(permission.type)}</TableCell>
                  <TableCell>{permission.reason}</TableCell>
                  <TableCell>{getStatusChip(permission.status)}</TableCell>
                  <TableCell>{new Date(permission.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No permission requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* New Permission Request Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>New Permission Request</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="course-label">Course</InputLabel>
              <Select
                labelId="course-label"
                id="course"
                name="course"
                value={formData.course}
                label="Course"
                onChange={handleFormChange}
                disabled={formSubmitting}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="type-label">Request Type</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                name="type"
                value={formData.type}
                label="Request Type"
                onChange={handleFormChange}
                disabled={formSubmitting}
              >
                <MenuItem value="absence">Absence</MenuItem>
                <MenuItem value="late">Late Arrival</MenuItem>
                <MenuItem value="early-leave">Early Departure</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="startDate"
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={handleFormChange}
              disabled={formSubmitting}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="endDate"
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={handleFormChange}
              disabled={formSubmitting}
              InputLabelProps={{ shrink: true }}
            />
            <p>If the leave is for one day then mention the same date in both start Date and end Date</p>
            <TextField
              margin="normal"
              required
              fullWidth
              id="reason"
              label="Reason"
              name="reason"
              multiline
              rows={4}
              value={formData.reason}
              onChange={handleFormChange}
              disabled={formSubmitting}
            />
            
            {/* <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Supporting Document (optional)
              </Typography>
              <input
                accept="image/*,.pdf,.doc,.docx"
                id="document"
                type="file"
                onChange={handleFileChange}
                disabled={formSubmitting}
              />
            </Box> */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={formSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentPermissions;