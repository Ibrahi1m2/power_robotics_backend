const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Test checkout route
app.post('/api/checkout/create-order', (req, res) => {
  console.log('Checkout request received:', req.body);
  res.json({ 
    message: 'Order created successfully (test)',
    order_id: 123,
    order_number: 'TEST-123',
    transaction_id: 'TXN-TEST-123'
  });
});

app.listen(port, () => {
  console.log(`Test server is running on port: ${port}`);
  console.log('This server will respond to checkout requests without database');
}); 