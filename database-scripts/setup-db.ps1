# Save as setup_db.ps1 and run: .\setup_db.ps1

# Generate cryptographically secure random hex strings (32 chars)
function Get-RandomHex {
	$bytes = [byte[]]::new(16)
	[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
	return (-join ($bytes | ForEach-Object { "{0:x2}" -f $_ }))
}

$PG_SUPERUSER_PASSWORD = Get-RandomHex
$APP_DB_USER_PASSWORD = Get-RandomHex
$DB_NAME = "email_client"
$CURRENT_USER = $env:USERNAME

# Create postgres role if not exists
& psql -d postgres -c @"
DO \$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
	CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD '$PG_SUPERUSER_PASSWORD';
  END IF;
END
\$$;

ALTER ROLE postgres WITH PASSWORD '$PG_SUPERUSER_PASSWORD';
GRANT postgres TO $CURRENT_USER;
"@

# Create database and user
& psql -U postgres -d postgres -c "CREATE DATABASE $DB_NAME;"
& psql -U postgres -d postgres -c "CREATE USER email_user WITH ENCRYPTED PASSWORD '$APP_DB_USER_PASSWORD';"

# Create tables with SERIAL columns
& psql -U postgres -d $DB_NAME -c @"
CREATE SCHEMA email_app;
GRANT USAGE ON SCHEMA email_app TO email_user;

CREATE TABLE email_app.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) >= 60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_app.folders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES email_app.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'custom')),
  system_name VARCHAR(50) CHECK (
	(type = 'system' AND system_name IN ('inbox', 'sent', 'drafts', 'trash')) OR
	(type = 'custom' AND system_name IS NULL)
  ),
  parent_folder_id INT REFERENCES email_app.folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE email_app.emails (
  id SERIAL PRIMARY KEY,
  sender_email VARCHAR(255) NOT NULL,
  google_message_id VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT,
  search_vector TSVECTOR,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  folder_id INT NOT NULL REFERENCES email_app.folders(id)
);

CREATE TABLE email_app.attachments (
  id SERIAL PRIMARY KEY,
  email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
  storage_key UUID NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL
);

CREATE INDEX idx_emails_folder_id ON email_app.emails(folder_id);
CREATE INDEX idx_folders_user_id ON email_app.folders(user_id);
CREATE INDEX idx_emails_search ON email_app.emails USING GIN(search_vector);

GRANT CONNECT ON DATABASE $DB_NAME TO email_user;
GRANT USAGE ON SCHEMA email_app TO email_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA email_app TO email_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA email_app TO email_user;
"@

# Print credentials
Write-Host "`nSAVE THESE SECRETS (WON'T SHOW AGAIN):" -ForegroundColor Green
Write-Host "Postgres Superuser Password: $PG_SUPERUSER_PASSWORD"
Write-Host "App DB User Password: $APP_DB_USER_PASSWORD"

