// src/components/shared/TopAppBarLoggedIn.js
import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const TopAppBarLoggedIn = ({ appTitle = "Form Builder" }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Load user info on component mount
  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        setUserInfo(JSON.parse(userInfoStr));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redirect to login page
    navigate('/login');
  };
  
  const handleDashboard = () => {
    navigate('/dashboard');
    handleClose();
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userInfo || !userInfo.name) return 'U';
    
    const nameParts = userInfo.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        color="default" 
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {appTitle}
          </Typography>
          
          {userInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                color="inherit"
                onClick={handleDashboard}
                startIcon={<DashboardIcon />}
                size="small"
                sx={{ mr: 2 }}
              >
                Dashboard
              </Button>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={handleMenu}
              >
                <Avatar 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    fontSize: '0.875rem',
                    bgcolor: 'primary.main',
                    mr: 1
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  {userInfo.name || userInfo.username}
                </Typography>
                
                <KeyboardArrowDownIcon fontSize="small" />
              </Box>
              
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'user-button',
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleClose}>
                  <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Toolbar placeholder to push content below the fixed AppBar */}
      <Toolbar variant="dense" />
      
      {/* Extra spacing to avoid content being covered by the AppBar */}
      <Box sx={{ height: 12 }} />
    </>
  );
};

export default TopAppBarLoggedIn;