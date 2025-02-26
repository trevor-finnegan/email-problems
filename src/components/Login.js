import React from 'react';
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
        <button onClick={handleAuthClick}>Sign in with Google</button>
      </div>
    </div>
  );
};

export default Login;
