const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

try {
  // Check if already initialized
  if (fs.existsSync('.initialized')) {
    console.error('Error: Database already initialized. Run "npm run start" to launch the app.');
    process.exit(1);
  }

  // Run OS-specific setup
  if (os.platform() === 'win32') {
    console.log('Initializing database for Windows...');
    execSync('npm run launcher:win', { stdio: 'inherit' });
  } else {
    console.log('Initializing database for Unix...');
    execSync('npm run launcher', { stdio: 'inherit' });
  }

  // Create flag file on success
  fs.writeFileSync('.initialized', '');
  console.log('Database initialized successfully.');
} catch (error) {
  console.error('Initialization failed:', error);
  process.exit(1);
}