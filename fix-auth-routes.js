const fs = require('fs');
const path = require('path');

// List of route files to fix
const routeFiles = [
    'routes/users.js',
    'routes/reviews.js',
    'routes/gmail.js',
    'routes/email.js',
    'routes/dashboard.js',
    'routes/categories.js'
];

console.log('Fixing authenticateToken references in route files...');

routeFiles.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace authenticateToken with required
        content = content.replace(/authenticateToken/g, 'required');
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
});

console.log('Route files fixed successfully!'); 