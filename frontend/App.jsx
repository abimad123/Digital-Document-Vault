import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import Welcome from './components/Welcome';
import FeaturesPage from './components/FeaturesPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ContactPage from './components/ContactPage';
import ProfilePage from './components/ProfilePage';

import { INITIAL_DOCUMENTS, INITIAL_ACTIVITY, USER_MOCK } from './constants';
import { Settings, ShieldCheck } from 'lucide-react';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITY);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [vaultFiles, setVaultFiles] = useState([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Private Route Wrapper to protect the dashboard
  const PrivateRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={
          <Welcome 
            onLogin={() => {}} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />
        
        <Route path="/features" element={
          <FeaturesPage 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />

        <Route path="/login" element={
          <LoginPage 
            onLoginSuccess={() => setIsLoggedIn(true)} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />

        <Route path="/register" element={
          <RegisterPage 
            onRegisterSuccess={() => setIsLoggedIn(true)} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />

        <Route path="/contact" element={
          <ContactPage 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />

        {/* --- Protected Dashboard Routes --- */}
        <Route 
          path="/dashboard/*" 
          element={
            <PrivateRoute>
              <Dashboard 
                documents={documents} 
                activities={activities} 
                user={USER_MOCK}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                vaultFiles={vaultFiles}
                setVaultFiles={setVaultFiles}
                onLogout={() => setIsLoggedIn(false)}
              />
            </PrivateRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;