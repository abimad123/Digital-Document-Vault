import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import FeaturesPage from './pages/FeaturesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import Dashboard from './pages/Dashboard'; 
import ForgotPassword from './pages/ForgotPassword';
import { clearSession, getValidToken, setSession, SESSION_EVENT, tokenExpiry } from './auth/session';

const App = () => {
  // --- STATE MANAGEMENT ---
  // Initialize state directly from localStorage so it survives page refreshes instantly
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getValidToken());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState({ name: 'User', tier: 'Free' });

  useEffect(() => {
    let timer;
    const syncSession = () => {
      clearTimeout(timer);
      const token = getValidToken();
      setIsLoggedIn(!!token);
      if (token) timer = setTimeout(syncSession, Math.min(tokenExpiry(token) - Date.now() + 10, 2147483647));
    };
    syncSession();
    window.addEventListener(SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);
    window.addEventListener('focus', syncSession);
    document.addEventListener('visibilitychange', syncSession);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('focus', syncSession);
      document.removeEventListener('visibilitychange', syncSession);
    };
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Handle Login
  const handleLoginSuccess = (token) => {
    setIsLoggedIn(setSession(token));
  };

  // Handle Logout (Clears the session completely)
  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
  };

  // Private Route Wrapper (Protects Dashboard)
  const PrivateRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/login" replace />;
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

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* --- Auth Routes (Redirects to Dashboard if already logged in) --- */}
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : 
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
          />
        } />

        <Route path="/register" element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : 
          <RegisterPage 
            onRegisterSuccess={handleLoginSuccess} 
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
                user={user} 
                onLogout={handleLogout}
              />
            </PrivateRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
