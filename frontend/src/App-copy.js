// In App.js
import FormBuilderEditPage from "./pages/FormBuilderPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        
        {/* Temporary test route */}
        <Route 
          path="/" 
          element={<FormBuilderEditPage />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;