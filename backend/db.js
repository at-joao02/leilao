const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

const db = new Database(DB_PATH);

// Performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS artworks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    artist          TEXT    NOT NULL,
    description     TEXT,
    image           TEXT,
    starting_price  REAL    NOT NULL,
    current_price   REAL    NOT NULL,
    auction_end     TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bidders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    company      TEXT,
    is_anonymous INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bids (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    artwork_id INTEGER NOT NULL REFERENCES artworks(id),
    bidder_id  INTEGER NOT NULL REFERENCES bidders(id),
    amount     REAL    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

module.exports = db;
