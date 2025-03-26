import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { FormProvider } from './contexts/FormContext';
import { ResponseProvider } from './contexts/ResponseContext';

// Layout Components
import Navbar from './components/layout/Navbar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Home
import LandingPage from './components/home/LandingPage';

// Form Components
import FormBuilder from './components/forms/FormBuilder';
import FormsList from './components/forms/FormsList';
import FormView from './components/forms/FormView';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <FormProvider>
            <ResponseProvider>
              <Navbar />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Form Routes */}
                  <Route path="/forms" element={<FormsList />} />
                  <Route path="/forms/new" element={<FormBuilder />} />
                  <Route path="/forms/:formId/edit" element={<FormBuilder />} />
                  <Route path="/forms/:formId/view" element={<FormView />} />
                  
                  {/* Add more protected routes here */}
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ResponseProvider>
          </FormProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
