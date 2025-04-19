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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    roomNumber: '',
    capacity: 0,
    type: 'classroom',
    facilities: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/locations`);
      setLocations(res.data);
      
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddLocation = () => {
    setFormData({
      name: '',
      building: '',
      roomNumber: '',
      capacity: 0,
      type: 'classroom',
      facilities: ''
    });
    setOpenAddDialog(true);
  };

  const handleEditLocation = (location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name || '',
      building: location.building || '',
      roomNumber: location.roomNumber || '',
      capacity: location.capacity || 0,
      type: location.type || 'classroom',
      facilities: location.facilities || ''
    });
    setOpenEditDialog(true);
  };

  const handleDeleteLocation = (location) => {
    setSelectedLocation(location);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenDeleteDialog(false);
    setSelectedLocation(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitAdd = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/locations`, formData);
      
      setSuccess('Location added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchLocations();
      
    } catch (err) {
      console.error('Error adding location:', err);
      setError(err.response?.data?.msg || 'Failed to add location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/locations/${selectedLocation._id}`, formData);
      
      setSuccess('Location updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchLocations();
      
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err.response?.data?.msg || 'Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/locations/${selectedLocation._id}`);
      
      setSuccess('Location deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      handleCloseDialog();
      fetchLocations();
      
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(err.response?.data?.msg || 'Failed to delete location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    return (
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getLocationTypeChip = (type) => {
    switch (type) {
      case 'classroom':
        return <Chip label="Classroom" color="primary" size="small" />;
      case 'lab':
        return <Chip label="Laboratory" color="secondary" size="small" />;
      case 'hall':
        return <Chip label="Hall" color="success" size="small" />;
      case 'office':
        return <Chip label="Office" color="info" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Location Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLocation}
        >
          Add Location
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Search locations..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
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
      ) : filteredLocations.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Building</TableCell>
                <TableCell>Room Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Facilities</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location._id}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.building}</TableCell>
                  <TableCell>{location.roomNumber}</TableCell>
                  <TableCell>{getLocationTypeChip(location.type)}</TableCell>
                  <TableCell>{location.capacity}</TableCell>
                  <TableCell>{location.facilities}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditLocation(location)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLocation(location)}
                      >
                        <DeleteIcon />
                      </IconButton>
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
            No locations found.
          </Typography>
        </Paper>
      )}
      
      {/* Add Location Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Building"
                name="building"
                value={formData.building}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleFormChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                required
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Laboratory</option>
                <option value="hall">Hall</option>
                <option value="office">Office</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facilities"
                name="facilities"
                value={formData.facilities}
                onChange={handleFormChange}
                placeholder="e.g. Projector, Whiteboard, Computers"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAdd} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Location'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Building"
                name="building"
                value={formData.building}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleFormChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                required
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Laboratory</option>
                <option value="hall">Hall</option>
                <option value="office">Office</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facilities"
                name="facilities"
                value={formData.facilities}
                onChange={handleFormChange}
                placeholder="e.g. Projector, Whiteboard, Computers"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Location'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Location Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
      >
        <DialogTitle>Delete Location</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the location "{selectedLocation?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitDelete} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminLocations;