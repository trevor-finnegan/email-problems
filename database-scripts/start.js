const { execSync } = require('child_process');
const os = require('os');

try {
  // Run appropriate setup command
  if (os.platform() === 'win32') {
    console.log('Running Windows database setup...');
    execSync('npm run launcher:win', { stdio: 'inherit' });
  } else {
    console.log('Running Unix database setup...');
    execSync('npm run launcher', { stdio: 'inherit' });
  }

  // Start application
  console.log('Starting application...');
  execSync('npm run start:app', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start:', error);
  process.exit(1);
}