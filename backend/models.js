const db = require('./db');
const crypto = require('crypto');

// ── Users ─────────────────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const User = {
  count() {
    return db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  },

  findAdmin() {
    return db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
  },

  create({ email, password, role = 'admin' }) {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    ).run(email, hashPassword(password), role);
    return result.lastInsertRowid;
  },

  verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
  },

  updatePassword(id, password) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
  },
};

// ── Artworks ──────────────────────────────────────────────────────────────────

const Artwork = {
  findAll() {
    return db.prepare(`
      SELECT
        a.*,
        CASE WHEN a.auction_end > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_active,
        (SELECT COUNT(*) FROM bids WHERE artwork_id = a.id) AS total_bids
      FROM artworks a
      ORDER BY a.auction_end ASC
    `).all();
  },

  findById(id) {
    return db.prepare(`
      SELECT
        a.*,
        CASE WHEN a.auction_end > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_active,
        (SELECT COUNT(*) FROM bids WHERE artwork_id = a.id) AS total_bids
      FROM artworks a
      WHERE a.id = ?
    `).get(id);
  },

  updateCurrentPrice(id, price) {
    db.prepare('UPDATE artworks SET current_price = ? WHERE id = ?').run(price, id);
  },
};

// ── Artists ───────────────────────────────────────────────────────────────────

const Artist = {
  findAll() {
    return db.prepare('SELECT * FROM artists ORDER BY name ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM artists WHERE id = ?').get(id);
  },

  findByName(name) {
    return db.prepare('SELECT * FROM artists WHERE name = ? COLLATE NOCASE').get(name);
  },

  create({ name, photo, bio }) {
    const result = db.prepare(
      'INSERT INTO artists (name, photo, bio) VALUES (?, ?, ?)'
    ).run(name, photo || '', bio || '');
    return result.lastInsertRowid;
  },

  update(id, { name, photo, bio }) {
    db.prepare('UPDATE artists SET name = ?, photo = ?, bio = ? WHERE id = ?')
      .run(name, photo || '', bio || '', id);
  },

  delete(id) {
    db.prepare('DELETE FROM artists WHERE id = ?').run(id);
  },
};

// ── Bidders ───────────────────────────────────────────────────────────────────

const Bidder = {
  create({ name, email, company, is_anonymous }) {
    const result = db.prepare(
      'INSERT INTO bidders (name, email, company, is_anonymous) VALUES (?, ?, ?, ?)'
    ).run(name, email, company || null, is_anonymous ? 1 : 0);
    return result.lastInsertRowid;
  },
};

// ── Bids ──────────────────────────────────────────────────────────────────────

const Bid = {
  getLastForArtwork(artwork_id) {
    return db.prepare(
      'SELECT * FROM bids WHERE artwork_id = ? ORDER BY amount DESC LIMIT 1'
    ).get(artwork_id);
  },

  listForArtwork(artwork_id) {
    return db.prepare(`
      SELECT
        b.id,
        b.amount,
        b.created_at,
        CASE WHEN d.is_anonymous = 1 THEN 'Anónimo' ELSE d.name  END AS bidder_name,
        CASE WHEN d.is_anonymous = 1 THEN NULL        ELSE d.company END AS company
      FROM bids b
      JOIN bidders d ON d.id = b.bidder_id
      WHERE b.artwork_id = ?
      ORDER BY b.created_at DESC
    `).all(artwork_id);
  },

  create({ artwork_id, bidder_id, amount }) {
    const result = db.prepare(
      'INSERT INTO bids (artwork_id, bidder_id, amount) VALUES (?, ?, ?)'
    ).run(artwork_id, bidder_id, amount);
    return result.lastInsertRowid;
  },
};

module.exports = { Artwork, Artist, Bidder, Bid, User };
