import React from 'react';
import '../App.css';
import {gapi} from 'gapi-script';
import {isUser, addUser} from '../api';

const Login = ({ setIsAuthenticated }) => {
  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn().then(() => {
      setIsAuthenticated(true);

      const user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        
      const email = user.getEmail();
        
      (async () => {
        const exists = await isUser(email); 
        console.log(exists);
        
        if (!exists) {
          await addUser(email, "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz");
          console.log("User added");
        }
      })();
      
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
