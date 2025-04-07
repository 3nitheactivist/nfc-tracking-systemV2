// import { StrictMode } from 'react'
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { createRoot } from 'react-dom/client'
import { AuthProvider } from './utils/config/AuthProvider';
import './utils/chartjs-register'; // Import Chart.js registration

import App from './App.jsx'
import './global.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)
