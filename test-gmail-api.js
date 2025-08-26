const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test Gmail API endpoints
async function testGmailAPI() {
  console.log('Testing Gmail API endpoints...\n');

  try {
    // Test getting emails
    console.log('1. Testing GET /gmail/emails...');
    const emailsResponse = await axios.get(`${BASE_URL}/gmail/emails`);
    console.log('✅ Emails endpoint working');
    console.log(`   Found ${emailsResponse.data.messages?.length || 0} emails\n`);

    // Test getting labels
    console.log('2. Testing GET /gmail/labels...');
    const labelsResponse = await axios.get(`${BASE_URL}/gmail/labels`);
    console.log('✅ Labels endpoint working');
    console.log(`   Found ${labelsResponse.data.labels?.length || 0} labels\n`);

    // Test search emails
    console.log('3. Testing GET /gmail/search?q=test...');
    const searchResponse = await axios.get(`${BASE_URL}/gmail/search?q=test`);
    console.log('✅ Search endpoint working');
    console.log(`   Found ${searchResponse.data.messages?.length || 0} search results\n`);

    // Test getting email by ID
    console.log('4. Testing GET /gmail/emails/1...');
    const emailResponse = await axios.get(`${BASE_URL}/gmail/emails/1`);
    console.log('✅ Email by ID endpoint working');
    console.log(`   Email subject: ${emailResponse.data.payload?.headers?.find(h => h.name === 'Subject')?.value || 'No subject'}\n`);

    console.log('🎉 All Gmail API endpoints are working correctly!');
    console.log('\nYou can now use the Email Inbox page in React Admin to view your emails.');

  } catch (error) {
    console.error('❌ Gmail API test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the Node.js server is running on port 5000');
    console.log('2. Check if the server started without errors');
    console.log('3. Verify the Gmail routes are properly configured');
  }
}

// Run the test
testGmailAPI(); 