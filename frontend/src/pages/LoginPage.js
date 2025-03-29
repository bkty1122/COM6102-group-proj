// src/pages/LoginPage.js
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Link
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to visit before being redirected to login
  const from = location.state?.from?.pathname || "/form-builder";
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if user is already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
    // Clear error message when user starts typing again
    if (errorMessage) setErrorMessage('');
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic form validation
    if (!credentials.username || !credentials.password) {
      setErrorMessage('Username and password are required.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // TEMPORARY MOCK AUTHENTICATION
      // =============================
      // NOTE: REPLACE THIS WITH ACTUAL BACKEND AUTHENTICATION
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Temporary hardcoded credential check - REMOVE THIS IN PRODUCTION
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        // Store auth token for persistent sessions
        if (rememberMe) {
          localStorage.setItem('authToken', 'temp-mock-auth-token');
        } else {
          sessionStorage.setItem('authToken', 'temp-mock-auth-token');
        }
        
        // Store basic user info
        const userInfo = {
          id: '1',
          username: credentials.username,
          role: 'admin',
          name: 'Administrator'
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // Redirect to the page they were trying to visit or default to form builder
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid credentials');
      }
      // =============================
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box 
            sx={{ 
              backgroundColor: 'primary.main', 
              color: 'white',
              width: 56, 
              height: 56, 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography component="h1" variant="h5" fontWeight="bold">
            Admin Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Welcome to the Linguo-Smart Form Builder
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={credentials.username}
            onChange={handleChange}
            disabled={isLoading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  color="primary"
                  disabled={isLoading}
                />
              }
              label="Remember me"
            />
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Linguo-Smart
          </Typography>
          
          {/* DEV MODE NOTICE - REMOVE IN PRODUCTION */}
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
              DEVELOPMENT MODE: Using temporary credentials (admin/admin)
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;