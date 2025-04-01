// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./utils/AuthGuard";

// Pages
import LoginPage from "./pages/LoginPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import DashboardPage from "./pages/DashboardPage"; // Import the DashboardPage

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/form-builder" 
          element={
            <RequireAuth>
              <FormBuilderPage />
            </RequireAuth>
          } 
        />
        
        {/* Redirect to dashboard if authenticated */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/* Fallback for unknown routes */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;