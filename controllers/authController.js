const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';
const orderEndpoint = require('../routes/orders.js')
const {db,db_promise} = require('../db');
const bcrypt = require('bcryptjs');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const app = express();
const upload = multer({ dest: 'uploads/' });

const accountSid = 'ACYOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const client = twilio(accountSid, authToken);

const FROM_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Twilio sandbox number
const TO_WHATSAPP_NUMBER = 'whatsapp:+919003779504'; // Recipient's WhatsApp number

app.use(express.json());

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  
  try{
    const [results]  = await db_promise.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email])
    
    if (results.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log("Hashed Password :: ",hashedPassword)
      
    try{
      const [insertResult] = await db_promise.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user']
      );
      return res.status(201).json({ message: 'Registration successfully done', userId: insertResult.insertId });
    }catch(err){
      console.error('DB ERROR:', err);
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      return res.status(500).json({ message: 'Database error', error: err.message || err });
    }

    }catch(err){
      console.error('DB ERROR 1:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
};

exports.login = async (req, res) => {
  console.log("Login Request :: ",req.body)
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try{

  const[results] = await db_promise.execute('SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?', [usernameOrEmail, usernameOrEmail]);
    
    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = results[0];
    console.log("User :: ",user)
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    var userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    var token = jwt.sign({ data: userData }, JWT_SECRET, { expiresIn: 60 * 60 });
    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token: token
    });
  }catch(err){
    console.error('DB ERROR:', err);
    return res.status(500).json({ message: 'Database error', error: err });
  }
};

// const hash = bcrypt.hashSync('rashik123@', 10);
// console.log(hash);

app.use('/api/orders', orderEndpoint);

exports.placeOrder = (req, res) => {
  const { user_id, product_id, quantity, total_price } = req.body;
  if (!user_id || !product_id || !quantity || !total_price) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  db.query(
    'INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)',
    [user_id, product_id, quantity, total_price],
    (err, result) => {
      if (err) {
        console.error('DB ERROR:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({ message: 'Order placed successfully', orderId: result.insertId });
    }
  );
};

exports.getAllOrders = (req, res) => {
  db.query(
    'SELECT * FROM orders',
    (err, results) => {
      if (err) {
        console.error('DB ERROR:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(200).json(results);
    }
  );
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('DB ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No user found with that email' });
    }
    // Generate a new random password
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], async (err2) => {
      if (err2) {
        console.error('DB ERROR:', err2);
        return res.status(500).json({ message: 'Database error', error: err2 });
      }
      // Send the new password to the user's email
      try {
        await emailController.sendEmail({
          body: {
            to: email,
            subject: 'Your New Password',
            text: `Your new password is: ${newPassword}`
          }
        }, {
          status: () => ({ json: () => {} }) // dummy response object
        });
        return res.status(200).json({ message: 'A new password has been sent to your email.' });
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
        return res.status(500).json({ message: 'Failed to send email', error: emailErr });
      }
    });
  });
};

// Endpoint to receive PDF and send to WhatsApp
app.post('/send-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);

    // Upload the file to a public URL (Twilio requires a public URL)
    // For demo, you can use a static file server or a service like AWS S3.
    // Here, we assume you have uploaded the file and have a public URL:
    const mediaUrl = 'https://your-public-url.com/path-to-pdf.pdf';

    // Send WhatsApp message with PDF
    await client.messages.create({
      from: FROM_WHATSAPP_NUMBER,
      to: TO_WHATSAPP_NUMBER,
      body: 'Here is your order slip PDF.',
      mediaUrl: [mediaUrl],
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ success: true, message: 'PDF sent to WhatsApp!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
