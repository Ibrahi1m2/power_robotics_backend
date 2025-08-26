const db = require('../db');

exports.getSummary = (req, res) => {
  const summary = {};
  db.query('SELECT COUNT(*) as totalUsers FROM users', (err, userResult) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    summary.totalUsers = userResult[0].totalUsers;
    db.query('SELECT COUNT(*) as totalProducts FROM products', (err, productResult) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      summary.totalProducts = productResult[0].totalProducts;
      db.query('SELECT COUNT(*) as totalOrders, IFNULL(SUM(total),0) as totalSales FROM orders', (err, orderResult) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        summary.totalOrders = orderResult[0].totalOrders;
        summary.totalSales = orderResult[0].totalSales;
        res.json(summary);
      });
    });
  });
}; 