const nodemailer = require('nodemailer');

// Test Gmail configuration
async function testGmailConfig() {
  console.log('Testing Gmail configuration...');
  
  const authOptions = [
    {
      service: 'gmail',
      auth: {
        user: 'iburahim004@gmail.com',
        pass: 'xfys znfq yrtf bnli'
      }
    },
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
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

  for (let i = 0; i < authOptions.length; i++) {
    console.log(`\nTesting config ${i + 1}...`);
    
    try {
      const transporter = nodemailer.createTransport(authOptions[i]);
      
      // Verify connection
      await transporter.verify();
      console.log(`✅ Config ${i + 1} - Connection verified successfully`);
      
      // Try to send a test email
      const mailOptions = {
        from: 'iburahim004@gmail.com',
        to: 'iburahim004@gmail.com',
        subject: 'Test Email from Node.js',
        text: 'This is a test email to verify Gmail configuration.',
        html: '<p>This is a test email to verify Gmail configuration.</p>'
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Config ${i + 1} - Test email sent successfully!`);
      console.log(`Message ID: ${info.messageId}`);
      
      return true;
      
    } catch (error) {
      console.log(`❌ Config ${i + 1} failed:`, error.message);
      
      if (error.code === 'EAUTH') {
        console.log('   Authentication failed - check app password');
      } else if (error.code === 'ECONNECTION') {
        console.log('   Connection failed - check internet/network');
      }
    }
  }
  
  console.log('\n❌ All configurations failed');
  return false;
}

// Run the test
testGmailConfig()
  .then(success => {
    if (success) {
      console.log('\n🎉 Email configuration is working!');
    } else {
      console.log('\n💥 Email configuration needs to be fixed.');
      console.log('\nTroubleshooting steps:');
      console.log('1. Check if 2-factor authentication is enabled on Gmail');
      console.log('2. Generate a new app password: Google Account > Security > App passwords');
      console.log('3. Make sure the app password is correct (no spaces)');
      console.log('4. Check if "Less secure app access" is enabled (if not using app password)');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  }); 