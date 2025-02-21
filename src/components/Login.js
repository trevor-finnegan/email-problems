import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import '../App.css';
import {gapi} from 'gapi-script';

const Login = ({ setIsAuthenticated }) => {
  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn().then(() => {
      setIsAuthenticated(true);
    });
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>LOGIN</h2>
        {/*errorMessage && <p className="error-message">{errorMessage}</p>*/}
{/*}
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
        */}
        <button onClick={handleAuthClick}>Sign in with Google</button>
      </div>
    </div>
  );
};

export default Login;
