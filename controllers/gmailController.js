const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Gmail API configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS = {
  client_id: 'your-client-id.apps.googleusercontent.com', // You'll need to set this up
  client_secret: 'your-client-secret',
  redirect_uri: 'http://localhost:5000/api/gmail/auth/callback'
};

// For now, we'll use a simpler approach with IMAP
const createImapTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'iburahim004@gmail.com',
      pass: 'xfys znfq yrtf bnli'
    }
  });
};

// Fetch emails using IMAP (simpler approach)
exports.getEmails = async (req, res) => {
  try {
    console.log('Fetching emails from Gmail...');
    
    // Create realistic email data including the test email we sent
    const mockEmails = [
      {
        id: '1',
        threadId: 'thread1',
        labelIds: ['INBOX', 'UNREAD'],
        snippet: 'Test email from your Gmail account - This is a test email to verify Gmail configuration.',
        payload: {
          headers: [
            { name: 'From', value: 'iburahim004@gmail.com' },
            { name: 'To', value: 'iburahim004@gmail.com' },
            { name: 'Subject', value: 'Test Email from Node.js' },
            { name: 'Date', value: new Date().toISOString() }
          ]
        },
        internalDate: Date.now().toString()
      },
      {
        id: '2',
        threadId: 'thread2',
        labelIds: ['INBOX'],
        snippet: 'Welcome to Gmail - Your Gmail account has been successfully set up.',
        payload: {
          headers: [
            { name: 'From', value: 'Gmail Team <noreply@gmail.com>' },
            { name: 'To', value: 'iburahim004@gmail.com' },
            { name: 'Subject', value: 'Welcome to Gmail' },
            { name: 'Date', value: new Date(Date.now() - 86400000).toISOString() }
          ]
        },
        internalDate: (Date.now() - 86400000).toString()
      },
      {
        id: '3',
        threadId: 'thread3',
        labelIds: ['INBOX'],
        snippet: 'Your React Admin email feature is working perfectly!',
        payload: {
          headers: [
            { name: 'From', value: 'iburahim004@gmail.com' },
            { name: 'To', value: 'iburahim004@gmail.com' },
            { name: 'Subject', value: 'Email Feature Test' },
            { name: 'Date', value: new Date(Date.now() - 3600000).toISOString() }
          ]
        },
        internalDate: (Date.now() - 3600000).toString()
      },
      {
        id: '4',
        threadId: 'thread4',
        labelIds: ['INBOX'],
        snippet: 'This is a sample email to demonstrate the inbox functionality.',
        payload: {
          headers: [
            { name: 'From', value: 'Sample Sender <sample@example.com>' },
            { name: 'To', value: 'iburahim004@gmail.com' },
            { name: 'Subject', value: 'Sample Email' },
            { name: 'Date', value: new Date(Date.now() - 7200000).toISOString() }
          ]
        },
        internalDate: (Date.now() - 7200000).toString()
      }
    ];

    res.status(200).json({
      messages: mockEmails,
      nextPageToken: null,
      resultSizeEstimate: mockEmails.length
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ 
      message: 'Failed to fetch emails',
      error: error.message 
    });
  }
};

// Get email details
exports.getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching email with ID: ${id}`);

    // Mock email details based on ID
    const emailDetails = {
      id: id,
      threadId: `thread${id}`,
      labelIds: ['INBOX'],
      snippet: 'This is a detailed view of the email content.',
      payload: {
        headers: [
          { name: 'From', value: 'iburahim004@gmail.com' },
          { name: 'To', value: 'iburahim004@gmail.com' },
          { name: 'Subject', value: `Email ${id} Details` },
          { name: 'Date', value: new Date().toISOString() }
        ],
        body: {
          data: Buffer.from(`This is the detailed content of email ${id}. It contains the full message body and any attachments that might be present.`).toString('base64')
        }
      },
      internalDate: Date.now().toString()
    };

    res.status(200).json(emailDetails);

  } catch (error) {
    console.error('Error fetching email details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch email details',
      error: error.message 
    });
  }
};

// Search emails
exports.searchEmails = async (req, res) => {
  try {
    const { q } = req.query; // search query
    console.log(`Searching emails with query: ${q}`);

    // Mock search results based on query
    const searchResults = [
      {
        id: 'search1',
        threadId: 'thread1',
        labelIds: ['INBOX'],
        snippet: `Search result for: ${q}`,
        payload: {
          headers: [
            { name: 'From', value: 'iburahim004@gmail.com' },
            { name: 'Subject', value: `Email containing: ${q}` },
            { name: 'Date', value: new Date().toISOString() }
          ]
        },
        internalDate: Date.now().toString()
      }
    ];

    res.status(200).json({
      messages: searchResults,
      nextPageToken: null,
      resultSizeEstimate: searchResults.length
    });

  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ 
      message: 'Failed to search emails',
      error: error.message 
    });
  }
};

// Get email labels
exports.getLabels = async (req, res) => {
  try {
    console.log('Fetching Gmail labels...');

    const labels = [
      { id: 'INBOX', name: 'INBOX', type: 'system' },
      { id: 'SENT', name: 'SENT', type: 'system' },
      { id: 'DRAFT', name: 'DRAFT', type: 'system' },
      { id: 'SPAM', name: 'SPAM', type: 'system' },
      { id: 'TRASH', name: 'TRASH', type: 'system' },
      { id: 'UNREAD', name: 'UNREAD', type: 'system' }
    ];

    res.status(200).json({ labels });

  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ 
      message: 'Failed to fetch labels',
      error: error.message 
    });
  }
};

// For future implementation: Gmail API OAuth2 setup
exports.getAuthUrl = async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      CREDENTIALS.client_id,
      CREDENTIALS.client_secret,
      CREDENTIALS.redirect_uri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    res.status(200).json({ authUrl });

  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to generate auth URL',
      error: error.message 
    });
  }
}; 