import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import api from '../../api';

const StudentProfile = () => {
  const { user, updateProfile } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    profileImage: null
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile data
        const res = await api.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/profile`);
        setProfileData(res.data);
        
        // Initialize form data
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          emergencyContact: res.data.emergencyContact || '',
          profileImage: null
        });
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      profileImage: e.target.files[0]
    });
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form data
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        emergencyContact: profileData.emergencyContact || '',
        profileImage: null
      });
    }
    setEditMode(!editMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      // Send as JSON payload instead of FormData
      const payload = {
        name: formData.name,
        email: profileData.email, // Always send email
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact
      };
      // Update profile
      const res = await updateProfile(user.id, payload);
      setProfileData({ ...profileData, ...res });
      setSuccess(true);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.msg || 'Failed to update profile. Please try again.');
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

  if (error && !profileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Profile Image and Basic Info */}
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar
                src={profileData?.profileImage}
                alt={profileData?.name}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              />
              {/* {editMode && (
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    id="profile-image"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-image">
                    <Button variant="outlined" component="span">
                      Change Photo
                    </Button>
                  </label>
                </Box>
              )} */}
              <Typography variant="h6" sx={{ mt: 2 }}>
                {profileData?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Student ID: {profileData?.studentId}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Department: {profileData?.department}
              </Typography>
            </Grid>
            
            {/* Profile Details */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                  onClick={handleEditToggle}
                  color={editMode ? 'error' : 'primary'}
                  disabled={saving}
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </Button>
                {editMode && (
                  <Button
                    type="submit"
                    startIcon={<SaveIcon />}
                    variant="contained"
                    sx={{ ml: 2 }}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={editMode ? formData.name : profileData?.name || ''}
                    onChange={handleChange}
                    disabled={!editMode || saving}
                    variant={editMode ? 'outlined' : 'filled'}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={profileData?.email || ''}
                    disabled
                    variant="filled"
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={editMode ? formData.phone : profileData?.phone || ''}
                    onChange={handleChange}
                    disabled={!editMode || saving}
                    variant={editMode ? 'outlined' : 'filled'}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={editMode ? formData.address : profileData?.address || ''}
                    onChange={handleChange}
                    disabled={!editMode || saving}
                    variant={editMode ? 'outlined' : 'filled'}
                    multiline
                    rows={2}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Emergency Contact"
                    name="emergencyContact"
                    value={editMode ? formData.emergencyContact : profileData?.emergencyContact || ''}
                    onChange={handleChange}
                    disabled={!editMode || saving}
                    variant={editMode ? 'outlined' : 'filled'}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Profile updated successfully"
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CancelIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default StudentProfile;