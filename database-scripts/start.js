const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Check initialization
  if (!fs.existsSync('.initialized')) {
    console.error('Error: Database not initialized. Run "npm run init" first.');
    process.exit(1);
  }

  // Start the app
  console.log('Starting application...');
  execSync('npm run start:app', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start:', error);
  process.exit(1);
}