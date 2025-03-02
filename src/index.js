import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={ "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com" }>
    <App />
  </GoogleOAuthProvider>
);

