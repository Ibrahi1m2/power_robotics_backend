function isAdmin(req, res, next) {
  console.log("Admin middleware : ",req.user)
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
}

module.exports = isAdmin; 