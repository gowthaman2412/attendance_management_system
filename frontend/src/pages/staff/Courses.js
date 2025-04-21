import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add as AddIcon, People as PeopleIcon } from '@mui/icons-material';
import axios from 'axios';

const StaffCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openStudentsDialog, setOpenStudentsDialog] = useState(false);
  const [openAddMaterialDialog, setOpenAddMaterialDialog] = useState(false);
  const [materialData, setMaterialData] = useState({
    title: '',
    description: '',
    link: ''
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get('/api/courses/staff');
        setCourses(res.data);
        
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  const handleViewStudents = (course) => {
    setSelectedCourse(course);
    setOpenStudentsDialog(true);
  };

  const handleCloseStudentsDialog = () => {
    setOpenStudentsDialog(false);
  };

  const handleAddMaterial = (course) => {
    setSelectedCourse(course);
    setOpenAddMaterialDialog(true);
  };

  const handleCloseAddMaterialDialog = () => {
    setOpenAddMaterialDialog(false);
    setMaterialData({
      title: '',
      description: '',
      link: ''
    });
  };

  const handleMaterialInputChange = (e) => {
    const { name, value } = e.target;
    setMaterialData({
      ...materialData,
      [name]: value
    });
  };

  const handleSubmitMaterial = async () => {
    try {
      if (selectedCourse && (selectedCourse.id || selectedCourse.id)) {
        const courseId = selectedCourse.id || selectedCourse.id;
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/courses/${courseId}/materials`, materialData);
        
        // Refresh courses data
        const res = await axios.get('/api/courses/staff');
        setCourses(res.data);
        
        handleCloseAddMaterialDialog();
      } else {
        // Handle error: course not selected
        alert('Please select a valid course before adding materials.');
      }
    } catch (err) {
      console.error('Error adding course material:', err);
      setError('Failed to add course material. Please try again.');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Courses
        </Typography>
      </Box>
      
      {courses.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            You are not assigned to any courses yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} md={6} key={course.id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {course.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {course.code}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Department: {course.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Enrolled: {course.students?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Credits: {course.credits}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {/* <Typography variant="subtitle2" gutterBottom>
                      Schedule:
                    </Typography> */}
                    {course.schedule?.map((scheduleItem, index) => (
                      <Chip 
                        key={index}
                        label={`${scheduleItem.day} ${scheduleItem.startTime}-${scheduleItem.endTime}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<PeopleIcon />}
                    onClick={() => handleViewStudents(course)}
                  >
                    View Students
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={() => handleAddMaterial(course)}
                  >
                    Add Material
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Students Dialog */}
      <Dialog
        open={openStudentsDialog}
        onClose={handleCloseStudentsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse?.name} - Enrolled Students
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse?.students?.length > 0 ? (
            <List>
              {selectedCourse.students.map((student) => (
                <React.Fragment key={student.id}>
                  <ListItem>
                    <ListItemText
                      primary={student.name}
                      secondary={`ID: ${student.studentId} | Email: ${student.email}`}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No students enrolled in this course.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Material Dialog */}
      <Dialog
        open={openAddMaterialDialog}
        onClose={handleCloseAddMaterialDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Course Material - {selectedCourse?.name}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Title"
              name="title"
              value={materialData.title}
              onChange={handleMaterialInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={materialData.description}
              onChange={handleMaterialInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="link"
              label="Link or Resource URL"
              name="link"
              value={materialData.link}
              onChange={handleMaterialInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddMaterialDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitMaterial}
            variant="contained"
            disabled={!materialData.title || !materialData.link}
          >
            Add Material
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffCourses;