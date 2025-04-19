import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  // Card,
  // CardContent,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Backup as BackupIcon,
  // Refresh as RefreshIcon,
  // Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    systemName: 'AIMS - Attendance & Information Management System',
    emailNotifications: false,
    autoBackup: false,
    backupFrequency: 'daily',
    attendanceReminders: false,
    defaultAttendanceStatus: 'absent',
    academicYear: '',
    semester: '',
    maintenanceMode: false,
    attendanceCheckInWindow: 15,
    attendanceGeoFencingRadius: 100,
    attendanceRequirePhoto: false,
    systemTheme: 'light'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [openBackupDialog, setOpenBackupDialog] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [backupHistory, setBackupHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastBackup: 'Never',
    serverStatus: 'Online',
    databaseStatus: 'Connected',
    totalUsers: 0,
    totalCourses: 0,
    diskSpace: '0%'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch system settings
        const settingsRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/settings`);
        setSettings(s => ({
          ...s,
          ...settingsRes.data
        }));
        
        // Fetch system info
        const infoRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/settings/system-info`);
        setSystemInfo(infoRes.data);
        
        // Fetch backup history
        const backupRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/settings/backup-history`);
        setBackupHistory(backupRes.data);
        
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...settings,
        attendanceCheckInWindow: Number(settings.attendanceCheckInWindow),
        attendanceGeoFencingRadius: Number(settings.attendanceGeoFencingRadius),
        attendanceRequirePhoto: !!settings.attendanceRequirePhoto,
        emailNotifications: !!settings.emailNotifications,
        autoBackup: !!settings.autoBackup,
        attendanceReminders: !!settings.attendanceReminders,
        maintenanceMode: !!settings.maintenanceMode
      };
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/settings`, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenBackupDialog = () => {
    setOpenBackupDialog(true);
    setBackupNote('');
  };

  const handleCloseBackupDialog = () => {
    setOpenBackupDialog(false);
  };

  const handleBackupNoteChange = (e) => {
    setBackupNote(e.target.value);
  };

  const handleCreateBackup = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/settings/backup`, { note: backupNote });
      
      // Refresh backup history
      const backupRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/settings/backup-history`);
      setBackupHistory(backupRes.data);
      
      // Refresh system info to update last backup time
      const infoRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/settings/system-info`);
      setSystemInfo(infoRes.data);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      handleCloseBackupDialog();
      
    } catch (err) {
      console.error('Error creating backup:', err);
      setError('Failed to create backup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="System Name"
                  name="systemName"
                  value={settings.systemName}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  name="academicYear"
                  value={settings.academicYear}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. 2023-2024"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  // label="Semester"
                  name="semester"
                  value={settings.semester}
                  onChange={handleChange}
                  disabled={saving}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select Semester</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Default Attendance Status"
                  name="defaultAttendanceStatus"
                  value={settings.defaultAttendanceStatus}
                  onChange={handleChange}
                  disabled={saving}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Backup Frequency"
                  name="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={handleChange}
                  disabled={saving || !settings.autoBackup}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleChange}
                      name="emailNotifications"
                      color="primary"
                      disabled={saving}
                    />
                  }
                  label="Enable Email Notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.attendanceReminders}
                      onChange={handleChange}
                      name="attendanceReminders"
                      color="primary"
                      disabled={saving}
                    />
                  }
                  label="Send Attendance Reminders"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoBackup}
                      onChange={handleChange}
                      name="autoBackup"
                      color="primary"
                      disabled={saving}
                    />
                  }
                  label="Enable Automatic Backups"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange}
                      name="maintenanceMode"
                      color="error"
                      disabled={saving}
                    />
                  }
                  label="Maintenance Mode (Restricts User Access)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* System Information */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemText primary="Version" secondary={systemInfo.version} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Server Status" secondary={systemInfo.serverStatus} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Database Status" secondary={systemInfo.databaseStatus} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Last Backup" secondary={systemInfo.lastBackup} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Users" secondary={systemInfo.totalUsers} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Courses" secondary={systemInfo.totalCourses} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Disk Usage" secondary={systemInfo.diskSpace} />
              </ListItem>
            </List>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<BackupIcon />}
                onClick={handleOpenBackupDialog}
                disabled={saving}
              >
                Create Manual Backup
              </Button>
            </Box>
          </Paper>
          
          {/* Backup History */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Backup History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              {backupHistory.length > 0 ? (
                backupHistory.map((backup, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={new Date(backup.date).toLocaleString()} 
                      secondary={backup.note || 'No notes'} 
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No backup history found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Backup Dialog */}
      <Dialog open={openBackupDialog} onClose={handleCloseBackupDialog}>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a backup of all system data including users, courses, and attendance records.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="backup-note"
            label="Backup Note (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={backupNote}
            onChange={handleBackupNoteChange}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBackupDialog} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBackup} 
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Operation completed successfully
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSettings;