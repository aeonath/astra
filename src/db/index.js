// Copyright (c) 2026 MiraNova Studios
const Database = require('better-sqlite3');
const path = require('path');
const schema = require('./schema');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'astra.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
schema.init(db);

module.exports = db;
