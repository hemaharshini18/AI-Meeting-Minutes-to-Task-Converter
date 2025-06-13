console.log('Node.js is working!');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

// Try to import express
try {
  require('express');
  console.log('Express is installed!');
} catch (error) {
  console.log('Express is not installed:', error.message);
} 