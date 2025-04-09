const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Drop the database if it exists
  console.log('Dropping database...');
  execSync('psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS email_client;"');

  // Drop the user if it exists
  console.log('Dropping user...');
  execSync('psql -U postgres -d postgres -c "DROP USER IF EXISTS email_user;"');

  // Remove the initialization flag file
  if (fs.existsSync('.initialized')) {
    fs.unlinkSync('.initialized');
    console.log('Removed initialization flag.');
  }

  console.log("Succeeded. Now run `npm run init` to reinitialize the database.")

} catch (error) {
  console.error('Database reset failed:', error);
  process.exit(1);
}