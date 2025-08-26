const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(token)
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.log("User : ",user)
    // Set user information including role for admin middleware
    req.user = {
      id: user.data.id || user.uid,
      email: user.data.email,
      username: user.data.username,
      role: user.data.role || 'user' // Default to 'user' if no role specified
    };
    
    next();
  });
}

// Optional authentication - allows guest users but sets user info if token is provided
function authenticateOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue as guest user
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token, continue as guest user
      req.user = null;
      return next();
    }
    
    // Valid token, set user information
    req.user = {
      id: user.data.id || user.uid,
      email: user.data.email,
      username: user.data.username,
      role: user.data.role || 'user'
    };
    
    next();
  });
}

// Required authentication - must have valid token
function authenticateRequired(req, res, next) {
  return authenticateToken(req, res, next);
}

module.exports = {
  required: authenticateRequired,
  optional: authenticateOptional
}; 