import axios from 'axios';

// Define the email service URL
const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'https://hospital-management-email-service.onrender.com';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: EMAIL_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 second timeout
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
);

// API Configuration for the application
export const API_CONFIG = {
  BASE_URL: EMAIL_SERVICE_URL,
  EMAIL_ENDPOINT: '/send-email',
  axiosInstance,

  // Helper function for sending emails
  async sendEmail(recipient, subject, message) {
    try {
      console.log('Sending email request to:', `${EMAIL_SERVICE_URL}/send-email`);
      console.log('Email details:', { recipient, subject });
      
      const response = await axiosInstance.post('/send-email', {
        recipient,
        subject,
        message
      }, {
        timeout: 30000, // Increase timeout to 30 seconds
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('Email sent successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('API Error:', error.response?.data || error);
      console.error('Email sending failed:', error);
      throw error;
    }
  }
};

export default API_CONFIG; 