#!/bin/bash

# Generate cryptographically secure random hex strings (32 chars)
PG_SUPERUSER_PASSWORD=$(openssl rand -hex 16)
APP_DB_USER_PASSWORD=$(openssl rand -hex 16)
DB_NAME="email_client"

# Create database and user
psql -U postgres -d postgres -c "ALTER ROLE postgres WITH PASSWORD '$PG_SUPERUSER_PASSWORD';"

psql -U postgres -d postgres -c "CREATE DATABASE $DB_NAME;"

psql -U postgres -d postgres -c "CREATE USER email_user WITH ENCRYPTED PASSWORD '$APP_DB_USER_PASSWORD';"

# Create tables
psql -U postgres -d $DB_NAME <<EOF
CREATE SCHEMA email_app;
GRANT USAGE ON SCHEMA email_app TO email_user;

-- Users table with password constraints
CREATE TABLE email_app.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) >= 60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders with system names enforced
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

-- Emails with full-text search support
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

-- Attachments with secure storage
CREATE TABLE email_app.attachments (
  id SERIAL PRIMARY KEY,
  email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
  storage_key UUID NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_emails_folder_id ON email_app.emails(folder_id);
CREATE INDEX idx_folders_user_id ON email_app.folders(user_id);
CREATE INDEX idx_emails_search ON email_app.emails USING GIN(search_vector);

-- Permissions
GRANT CONNECT ON DATABASE $DB_NAME TO email_user;
GRANT USAGE ON SCHEMA email_app TO email_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA email_app TO email_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA email_app TO email_user;
EOF

# Print credentials
echo -e "\nSAVE THESE SECRETS (WON'T SHOW AGAIN):"
echo "Postgres Superuser Password: $PG_SUPERUSER_PASSWORD"
echo "App DB User Password: $APP_DB_USER_PASSWORD"



