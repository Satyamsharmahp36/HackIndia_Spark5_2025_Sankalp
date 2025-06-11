import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './Appcontext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <>
    <AppProvider>
    <App />
    </AppProvider>
  </>
)