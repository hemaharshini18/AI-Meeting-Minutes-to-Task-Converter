// Setup script for Natural Task Planner
const { execSync } = require('child_process');

console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully!');
  
  console.log('\nStarting the application...');
  execSync('npx tsx server/index.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
} catch (error) {
  console.error('Error:', error.message);
} 