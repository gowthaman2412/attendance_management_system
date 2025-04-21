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
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';

const StaffPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [responseNote, setResponseNote] = useState('');
  const [responseAction, setResponseAction] = useState('');

  useEffect(() => {
    fetchPermissions();
  }, [tabValue]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/api/permissions';
      if (tabValue === 0) {
        endpoint = '/api/permissions/pending';
      } else if (tabValue === 1) {
        endpoint = '/api/permissions/approved';
      } else if (tabValue === 2) {
        endpoint = '/api/permissions/rejected';
      }
      
      const res = await axios.get(endpoint);
      setPermissions(res.data);
      
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewPermission = (permission) => {
    setSelectedPermission(permission);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };

  const handleOpenResponseDialog = (permission, action) => {
    setSelectedPermission(permission);
    setResponseAction(action);
    setResponseNote('');
    setOpenResponseDialog(true);
  };

  const handleCloseResponseDialog = () => {
    setOpenResponseDialog(false);
  };

  const handleResponseNoteChange = (e) => {
    setResponseNote(e.target.value);
  };

  const handleSubmitResponse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/permissions/${selectedPermission.id}`, {
        status: responseAction,
        staffNote: responseNote
      });
      
      setSuccess(`Permission request ${responseAction === 'approved' ? 'approved' : 'rejected'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseResponseDialog();
      fetchPermissions();
      
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission. Please try again.');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Permission Requests
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="permission tabs">
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : permissions.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.student?.name || 'Unknown'}</TableCell>
                  <TableCell>{permission.type}</TableCell>
                  <TableCell>{formatDate(permission.date)}</TableCell>
                  <TableCell>{getStatusChip(permission.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewPermission(permission)}
                      >
                        View
                      </Button>
                      
                      {permission.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleOpenResponseDialog(permission, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleOpenResponseDialog(permission, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} permission requests found.
          </Typography>
        </Paper>
      )}
      
      {/* View Permission Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Permission Request Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedPermission && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Student:</Typography>
                <Typography variant="body1">{selectedPermission.user?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Student ID:</Typography>
                <Typography variant="body1">{selectedPermission.user?.studentId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Type:</Typography>
                <Typography variant="body1">{selectedPermission.type}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date:</Typography>
                <Typography variant="body1">{ (selectedPermission.startDate!=selectedPermission.endDate) ? (`${formatDate(selectedPermission.startDate)} to ${formatDate(selectedPermission.endDate)}`) : (`${formatDate(selectedPermission.endDate)}`) }</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status:</Typography>
                <Typography variant="body1">{getStatusChip(selectedPermission.status)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Submitted On:</Typography>
                <Typography variant="body1">{formatDate(selectedPermission.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Reason:</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Typography variant="body1">{selectedPermission.reason}</Typography>
                </Paper>
              </Grid>
              {selectedPermission.status !== 'pending' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Staff Note:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography variant="body1">{selectedPermission.staffNote || 'No note provided'}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Response Dialog */}
      <Dialog
        open={openResponseDialog}
        onClose={handleCloseResponseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {responseAction === 'approved' ? 'Approve' : 'Reject'} Permission Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to {responseAction === 'approved' ? 'approve' : 'reject'} the permission request from {selectedPermission?.student?.name}.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={responseNote}
            onChange={handleResponseNoteChange}
            placeholder="Add a note to the student explaining your decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitResponse} 
            variant="contained" 
            color={responseAction === 'approved' ? 'success' : 'error'}
          >
            {responseAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffPermissions;