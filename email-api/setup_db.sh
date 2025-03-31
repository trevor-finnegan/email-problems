#!/bin/bash
# Save this as `setup_db.sh` and run: chmod +x setup_db.sh && ./setup_db.sh
# Save your “Secrets” (randomly generated passwords) securely.

# Use environment variables (never hardcode passwords!)
export PG_SUPERUSER_PASSWORD="$(openssl rand -hex 16)"  # Randomly generated
export APP_DB_USER_PASSWORD="$(openssl rand -hex 16)"
export DB_NAME="email_client"

# Create superuser and database
psql -U marioauqui -d postgres <<EOF
-- Avoid dropping default role; reset password instead
ALTER ROLE marioauqui WITH PASSWORD '$PG_SUPERUSER_PASSWORD';

-- Create app-specific database and user
CREATE DATABASE $DB_NAME;
CREATE USER email_user WITH ENCRYPTED PASSWORD '$APP_DB_USER_PASSWORD';
EOF

# Create tables in dedicated schema (not public)
psql -U marioauqui -d $DB_NAME <<EOF
-- Use a dedicated schema
CREATE SCHEMA email_app;
GRANT USAGE ON SCHEMA email_app TO email_user;

-- Users Table: Stores user accounts
CREATE TABLE email_app.users (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) > 0),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders Table: Stores system & user-created email folders
CREATE TABLE email_app.folders (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id INT NOT NULL REFERENCES email_app.users(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'custom')),
	system_name VARCHAR(50) CHECK (
		(type = 'system' AND system_name IN ('inbox', 'sent', 'trash', 'spam')) OR
		(type = 'custom' AND system_name IS NULL)
	)
);

-- Emails Table: Stores emails (sent and drafts)
CREATE TABLE email_app.emails (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sender_id INT NOT NULL REFERENCES email_app.users(id) ON DELETE CASCADE,
	subject TEXT,
	body TEXT,
	search_vector TSVECTOR, -- Optimized text search
	sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_read BOOLEAN DEFAULT FALSE,
	is_draft BOOLEAN DEFAULT FALSE, -- Supports drafts
	folder_id INT NOT NULL REFERENCES email_app.folders(id) ON DELETE CASCADE
);

-- Recipients Table: Supports multiple recipients per email
CREATE TABLE email_app.recipients (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
	recipient_email VARCHAR(255) NOT NULL,
	recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('to', 'cc', 'bcc'))
);

-- Attachments Table: Stores email attachments
CREATE TABLE email_app.attachments (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
	storage_key UUID NOT NULL UNIQUE, -- Unique reference to storage location
	file_name TEXT NOT NULL,
	mime_type TEXT NOT NULL,
	file_size BIGINT NOT NULL CHECK (file_size > 0)
);

-- Indexes for performance
CREATE INDEX idx_emails_folder_id ON email_app.emails(folder_id);
CREATE INDEX idx_folders_user_id ON email_app.folders(user_id);
CREATE INDEX idx_emails_search ON email_app.emails USING GIN(search_vector);

-- Least-privilege permissions
GRANT CONNECT ON DATABASE $DB_NAME TO email_user;
GRANT USAGE ON SCHEMA email_app TO email_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA email_app TO email_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA email_app TO email_user;
EOF

# Save credentials securely
echo -e "\n\033[1;32mSAVE THESE SECRETS (WON'T SHOW AGAIN):\033[0m"
echo "Postgres Superuser Password: $PG_SUPERUSER_PASSWORD"
echo "App DB User Password: $APP_DB_USER_PASSWORD"

