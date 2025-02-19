import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import '../App.css';

const Login = ({ onLoginSuccess }) => {
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLoginSuccess = (response) => {
    // Handle Google OAuth login success
    console.log('Google login success', response);
    onLoginSuccess(); // Redirect after successful Google login
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>LOGIN</h2> {/* Header */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap={false}  // Optional: Disables the one-tap sign-in feature
            theme="outline"    // Button style for a traditional look
            scope="https://www.googleapis.com/auth/gmail.readonly"
            text={"Choose gmail account"}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
