import React, {useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import Home from './components/Home';
import Login from './components/Login';
import './App.css';
import { Navigate } from 'react-router-dom';

const CLIENT_ID="100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com"
const API_KEY="AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-A"
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  useEffect(() => {
    const initClient = () => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
          scope: SCOPES,
        }).then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          setIsAuthenticated(authInstance.isSignedIn.get());
          authInstance.isSignedIn.listen(setIsAuthenticated);
        });
      });
    };

    initClient();
  }, []);

  return (
    <GoogleOAuthProvider clientId={ process.env.REACT_APP_GOOGLE_CLIENT_ID }>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/home" />} />
        <Route path="/home" element={isAuthenticated ? <Home setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
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

