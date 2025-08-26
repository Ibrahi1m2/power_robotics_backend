const nodemailer = require('nodemailer');

// Create Gmail transporter with multiple authentication options
const createTransporter = () => {
  // Try different authentication methods
  const authOptions = [
    {
      service: 'gmail',
      auth: {
        user: 'iburahim004@gmail.com',
        pass: 'xfys znfq yrtf bnli' // App password
      }
    },
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'iburahim004@gmail.com',
        pass: 'xfys znfq yrtf bnli'
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'iburahim004@gmail.com',
        pass: 'xfys znfq yrtf bnli'
      }
    }
  ];

  // Try to create transporter with different configurations
  for (let i = 0; i < authOptions.length; i++) {
    try {
      const transporter = nodemailer.createTransport(authOptions[i]);
      console.log(`Transporter created with config ${i + 1}`);
      return transporter;
    } catch (error) {
      console.log(`Config ${i + 1} failed:`, error.message);
      if (i === authOptions.length - 1) {
        throw new Error('All transporter configurations failed');
      }
    }
  }
};

// Verify transporter connection
const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify();
    console.log('Transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Transporter verification failed:', error);
    return false;
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    console.log('Email request received:', { to, subject, hasHtml: !!html, hasText: !!text });

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ 
        message: 'To, subject, and content are required' 
      });
    }

    const transporter = createTransporter();
    
    // Verify transporter
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      return res.status(500).json({ 
        message: 'Email service is not available. Please check Gmail settings.' 
      });
    }

    const mailOptions = {
      from: 'iburahim004@gmail.com',
      to: to,
      subject: subject,
      html: html || text,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if only HTML provided
    };

    console.log('Sending email with options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.status(200).json({ 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your app password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail failed. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message 
    });
  }
};

exports.sendEmailToSelf = async (req, res) => {
  try {
    const { subject, html, text } = req.body;

    console.log('Send to self request received:', { subject, hasHtml: !!html, hasText: !!text });

    // Validate required fields
    if (!subject || (!html && !text)) {
      return res.status(400).json({ 
        message: 'Subject and content are required' 
      });
    }

    const transporter = createTransporter();
    
    // Verify transporter
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      return res.status(500).json({ 
        message: 'Email service is not available. Please check Gmail settings.' 
      });
    }

    const mailOptions = {
      from: 'iburahim004@gmail.com',
      to: 'iburahim004@gmail.com', // Send to self
      subject: subject,
      html: html || text,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    console.log('Sending email to self with options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent to self successfully:', info.messageId);
    
    res.status(200).json({ 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Error sending email to self:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your app password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail failed. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message 
    });
  }
};

// Test endpoint to verify email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    console.log('Testing email configuration...');
    
    const transporter = createTransporter();
    const isVerified = await verifyTransporter(transporter);
    
    if (isVerified) {
      res.status(200).json({ 
        message: 'Email configuration is working correctly',
        status: 'success'
      });
    } else {
      res.status(500).json({ 
        message: 'Email configuration test failed',
        status: 'failed'
      });
    }
  } catch (error) {
    console.error('Email configuration test error:', error);
    res.status(500).json({ 
      message: 'Email configuration test failed',
      error: error.message,
      status: 'failed'
    });
  }
}; 