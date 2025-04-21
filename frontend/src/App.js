import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useAuthStore from './store/authStore';

// Layout Components
import StudentLayout from './layouts/StudentLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentPermissions from './pages/student/Permissions';
import StudentProfile from './pages/student/Profile';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import StaffCourses from './pages/staff/Courses';
import StaffAttendance from './pages/staff/Attendance';
import StaffPermissions from './pages/staff/Permissions';
import StaffProfile from './pages/staff/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import AdminDepartments from './pages/admin/Departments';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [authState, setAuthState] = React.useState({
    isChecking: true,
    isAuthenticated: false,
    userRole: null
  });
  
  React.useEffect(() => {
    // Check if user is authenticated via zustand store
    const authStore = useAuthStore.getState();
    if (authStore.token && authStore.user) {
      setAuthState({
        isChecking: false,
        isAuthenticated: true,
        userRole: authStore.user.role
      });
    } else {
      setAuthState({
        isChecking: false,
        isAuthenticated: false,
        userRole: null
      });
    }
  }, []);
  
  if (authState.isChecking) {
    return null; // Or loading indicator
  }
  
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(authState.userRole)) {
    // Redirect to appropriate dashboard based on role
    if (authState.userRole === 'student') {
      return <Navigate to="/student/dashboard" />;
    } else if (authState.userRole === 'staff') {
      return <Navigate to="/staff/dashboard" />;
    } else if (authState.userRole === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/login" />;
    }
  }
  
  return children;
};

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
});

function App() {
  const initializeAuth = useAuthStore(state => state.initializeAuth);
  
  // Initialize authentication on app load
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="permissions" element={<StudentPermissions />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          
          {/* Staff Routes */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="courses" element={<StaffCourses />} />
            <Route path="attendance" element={<StaffAttendance />} />
            <Route path="permissions" element={<StaffPermissions />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="student-enrollments" element={<AdminEnrollments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;