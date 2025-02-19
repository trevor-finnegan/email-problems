import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Home from './components/Home';
import Login from './components/Login';
import './App.css';

const App = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    navigate('/home');  // Navigate to Home page on successful login
  };

  return (
    <GoogleOAuthProvider clientId={ process.env.REACT_APP_GOOGLE_CLIENT_ID }>
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </GoogleOAuthProvider>
  );
};

const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;

