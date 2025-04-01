// src/utils/AuthGuard.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Check if the user is authenticated
export const isAuthenticated = () => {
  // Check for token in localStorage or sessionStorage
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return !!token; // Return true if token exists
  
  // TODO: For better security, implement token validation:
  // 1. Check token expiration
  // 2. Verify token format
  // 3. Optionally, make an API call to validate the token on the server
};

// Protected route component
export const RequireAuth = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};