const http = require('http');

console.log('Testing API endpoints...');

// Test the products endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data.substring(0, 200) + '...');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

// Test a specific product
setTimeout(() => {
  const options2 = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products/36',
    method: 'GET'
  };

  const req2 = http.request(options2, (res) => {
    console.log(`\nProduct 36 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Product 36 Response:', data.substring(0, 200) + '...');
    });
  });

  req2.on('error', (e) => {
    console.error(`Problem with product request: ${e.message}`);
  });

  req2.end();
}, 1000); 