#!/bin/bash

# Use environment variables (never hardcode passwords!)
export DB_NAME="email_client"

# Only create schema and tables (skip user/database creation)
psql -U postgres -d $DB_NAME <<EOF
-- Use a dedicated schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS email_app;

-- Users Table: Stores user accounts (only if not exists)
CREATE TABLE IF NOT EXISTS email_app.users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders Table: Stores system & user-created email folders
CREATE TABLE IF NOT EXISTS email_app.folders (
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
CREATE TABLE IF NOT EXISTS email_app.emails (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES email_app.users(id) ON DELETE CASCADE,
    subject TEXT,
    body TEXT,
    search_vector TSVECTOR,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    folder_id INT NOT NULL REFERENCES email_app.folders(id) ON DELETE CASCADE
);

-- Recipients Table: Supports multiple recipients per email
CREATE TABLE IF NOT EXISTS email_app.recipients (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('to', 'cc', 'bcc'))
);

-- Attachments Table: Stores email attachments
CREATE TABLE IF NOT EXISTS email_app.attachments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email_id INT NOT NULL REFERENCES email_app.emails(id) ON DELETE CASCADE,
    storage_key UUID NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_emails_folder_id ON email_app.emails(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON email_app.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_search ON email_app.emails USING GIN(search_vector);
EOF

echo -e "\n\033[1;32mSchema and tables created successfully in existing database $DB_NAME\033[0m"