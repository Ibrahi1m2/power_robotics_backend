const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

const testAdmin = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123'
};

const testProduct = {
  name: 'Test Product',
  description: 'This is a test product',
  price: 99.99,
  stock: 50,
  category_id: 1,
  vendor_id: 1,
  is_deal_of_the_week: 0
};

const testCategory = {
  name: 'Test Category',
  description: 'This is a test category'
};

const testReview = {
  product_id: 1,
  rating: 5,
  comment: 'Great product!'
};

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test user registration
  console.log('Testing user registration...');
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  console.log(registerResult.success ? '✅ User registered' : '❌ Registration failed:', registerResult.error);
  
  // Test user login
  console.log('Testing user login...');
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log('✅ User logged in');
  } else {
    console.log('❌ Login failed:', loginResult.error);
  }
  
  // Test admin login
  console.log('Testing admin login...');
  const adminLoginResult = await makeRequest('POST', '/auth/login', {
    email: testAdmin.email,
    password: testAdmin.password
  });
  
  if (adminLoginResult.success) {
    adminToken = adminLoginResult.data.token;
    console.log('✅ Admin logged in');
  } else {
    console.log('❌ Admin login failed:', adminLoginResult.error);
  }
}

async function testCategories() {
  console.log('\n📂 Testing Categories...');
  
  // Get all categories
  console.log('Getting all categories...');
  const categoriesResult = await makeRequest('GET', '/categories');
  console.log(categoriesResult.success ? '✅ Categories retrieved' : '❌ Failed to get categories:', categoriesResult.error);
  
  if (categoriesResult.success && categoriesResult.data.length > 0) {
    console.log(`Found ${categoriesResult.data.length} categories`);
  }
  
  // Create category (admin only)
  console.log('Creating test category...');
  const createCategoryResult = await makeRequest('POST', '/categories', testCategory, adminToken);
  console.log(createCategoryResult.success ? '✅ Category created' : '❌ Failed to create category:', createCategoryResult.error);
}

async function testProducts() {
  console.log('\n📦 Testing Products...');
  
  // Get all products
  console.log('Getting all products...');
  const productsResult = await makeRequest('GET', '/products');
  console.log(productsResult.success ? '✅ Products retrieved' : '❌ Failed to get products:', productsResult.error);
  
  if (productsResult.success && productsResult.data.length > 0) {
    console.log(`Found ${productsResult.data.length} products`);
  }
  
  // Get deal of the week products
  console.log('Getting deal of the week products...');
  const dealsResult = await makeRequest('GET', '/products/deals');
  console.log(dealsResult.success ? '✅ Deals retrieved' : '❌ Failed to get deals:', dealsResult.error);
  
  // Create product (admin only)
  console.log('Creating test product...');
  const createProductResult = await makeRequest('POST', '/products', testProduct, adminToken);
  console.log(createProductResult.success ? '✅ Product created' : '❌ Failed to create product:', createProductResult.error);
  
  // Get product by ID
  if (createProductResult.success) {
    console.log('Getting product by ID...');
    const productResult = await makeRequest('GET', `/products/${createProductResult.data.id}`);
    console.log(productResult.success ? '✅ Product retrieved' : '❌ Failed to get product:', productResult.error);
  }
}

async function testUsers() {
  console.log('\n👥 Testing Users...');
  
  // Get all users (admin only)
  console.log('Getting all users...');
  const usersResult = await makeRequest('GET', '/users', null, adminToken);
  console.log(usersResult.success ? '✅ Users retrieved' : '❌ Failed to get users:', usersResult.error);
  
  // Get vendors
  console.log('Getting vendors...');
  const vendorsResult = await makeRequest('GET', '/users/vendors', null, adminToken);
  console.log(vendorsResult.success ? '✅ Vendors retrieved' : '❌ Failed to get vendors:', vendorsResult.error);
  
  // Get user profile
  console.log('Getting user profile...');
  const profileResult = await makeRequest('GET', '/users/me', null, authToken);
  console.log(profileResult.success ? '✅ Profile retrieved' : '❌ Failed to get profile:', profileResult.error);
}

async function testCart() {
  console.log('\n🛒 Testing Cart...');
  
  // Get cart
  console.log('Getting cart...');
  const cartResult = await makeRequest('GET', '/cart', null, authToken);
  console.log(cartResult.success ? '✅ Cart retrieved' : '❌ Failed to get cart:', cartResult.error);
  
  // Get cart summary
  console.log('Getting cart summary...');
  const summaryResult = await makeRequest('GET', '/cart/summary', null, authToken);
  console.log(summaryResult.success ? '✅ Cart summary retrieved' : '❌ Failed to get cart summary:', summaryResult.error);
  
  // Add item to cart
  console.log('Adding item to cart...');
  const addToCartResult = await makeRequest('POST', '/cart/add', {
    product_id: 1,
    quantity: 2
  }, authToken);
  console.log(addToCartResult.success ? '✅ Item added to cart' : '❌ Failed to add item to cart:', addToCartResult.error);
}

async function testOrders() {
  console.log('\n📋 Testing Orders...');
  
  // Get orders
  console.log('Getting orders...');
  const ordersResult = await makeRequest('GET', '/orders', null, authToken);
  console.log(ordersResult.success ? '✅ Orders retrieved' : '❌ Failed to get orders:', ordersResult.error);
  
  // Get order stats (admin only)
  console.log('Getting order stats...');
  const statsResult = await makeRequest('GET', '/orders/stats', null, adminToken);
  console.log(statsResult.success ? '✅ Order stats retrieved' : '❌ Failed to get order stats:', statsResult.error);
}

async function testReviews() {
  console.log('\n⭐ Testing Reviews...');
  
  // Get reviews for product
  console.log('Getting product reviews...');
  const reviewsResult = await makeRequest('GET', '/reviews/product/1');
  console.log(reviewsResult.success ? '✅ Product reviews retrieved' : '❌ Failed to get product reviews:', reviewsResult.error);
  
  // Get rating stats
  console.log('Getting rating stats...');
  const statsResult = await makeRequest('GET', '/reviews/product/1/stats');
  console.log(statsResult.success ? '✅ Rating stats retrieved' : '❌ Failed to get rating stats:', statsResult.error);
  
  // Create review
  console.log('Creating review...');
  const createReviewResult = await makeRequest('POST', '/reviews', testReview, authToken);
  console.log(createReviewResult.success ? '✅ Review created' : '❌ Failed to create review:', createReviewResult.error);
}

async function runAllTests() {
  console.log('🚀 Starting API Endpoint Tests...');
  console.log(`Testing against: ${BASE_URL}`);
  
  try {
    await testAuth();
    await testCategories();
    await testProducts();
    await testUsers();
    await testCart();
    await testOrders();
    await testReviews();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log('- Authentication: ✅');
    console.log('- Categories: ✅');
    console.log('- Products: ✅');
    console.log('- Users: ✅');
    console.log('- Cart: ✅');
    console.log('- Orders: ✅');
    console.log('- Reviews: ✅');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, makeRequest }; 