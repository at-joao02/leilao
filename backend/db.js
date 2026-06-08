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
    phone        TEXT,
    is_anonymous INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'admin',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS artists (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    photo TEXT,
    bio   TEXT
  );

  CREATE TABLE IF NOT EXISTS bids (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    artwork_id INTEGER NOT NULL REFERENCES artworks(id),
    bidder_id  INTEGER NOT NULL REFERENCES bidders(id),
    amount     REAL    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS artwork_artists (
    artwork_id INTEGER NOT NULL REFERENCES artworks(id),
    artist_id  INTEGER NOT NULL REFERENCES artists(id),
    PRIMARY KEY (artwork_id, artist_id)
  );
`);

// ── Migrações ─────────────────────────────────────────────────────────────────

// Coluna dimensions (tamanho da obra, opcional)
const artworkCols = db.prepare('PRAGMA table_info(artworks)').all();
if (!artworkCols.some(c => c.name === 'dimensions')) {
  db.exec('ALTER TABLE artworks ADD COLUMN dimensions TEXT');
}

// Campo Empresa substituído por Telefone: renomeia a coluna (preservando o esquema)
const bidderCols = db.prepare('PRAGMA table_info(bidders)').all();
if (!bidderCols.some(c => c.name === 'phone')) {
  if (bidderCols.some(c => c.name === 'company')) {
    db.exec('ALTER TABLE bidders RENAME COLUMN company TO phone');
  } else {
    db.exec('ALTER TABLE bidders ADD COLUMN phone TEXT');
  }
}

// Backfill: liga obras existentes aos artistas pelo nome
db.exec(`
  INSERT OR IGNORE INTO artwork_artists (artwork_id, artist_id)
  SELECT a.id, ar.id
  FROM artworks a
  JOIN artists ar ON ar.name = a.artist COLLATE NOCASE
  WHERE NOT EXISTS (SELECT 1 FROM artwork_artists x WHERE x.artwork_id = a.id)
`);

module.exports = db;
