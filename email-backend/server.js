require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Add body parser middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    // 'https://hospital-management-system-one-phi.vercel.app'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add preflight handling
app.options('/send-email', cors());

// Add headers middleware
app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', 'https://nfc-tracking-system-one-phi.vercel.app');
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Debug environment variables (don't log the actual password in production)
console.log('Environment variables check:', {
  SMTP_HOST: process.env.SMTP_HOST ? 'Set' : 'Missing',
  SMTP_PORT: process.env.SMTP_PORT ? 'Set' : 'Missing',
  SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
  SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing'
});

// Create transporter with explicit configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Debug middleware
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    body: req.body
  });
  next();
});

// Email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { recipient, subject, message } = req.body;
    
    console.log('Attempting to send email:', {
      to: recipient,
      subject: subject,
      from: process.env.SMTP_USER
    });

    if (!recipient || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipient,
      subject: subject,
      html: message
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info);
    
    res.status(200).json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this route to handle appointment emails
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    emailServiceConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      user: process.env.SMTP_USER ? 'configured' : 'missing',
      auth: process.env.SMTP_PASS ? 'configured' : 'missing'
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email service configuration:', {
    host: 'smtp.gmail.com',
    port: 587,
    user: process.env.SMTP_USER ? '***exists***' : '***missing***'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});
