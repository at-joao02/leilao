require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Router } = require('express');
const db = require('./db');
const { Artwork, Artist, User } = require('./models');

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

function verifyAdminPassword(provided) {
  if (!provided) return false;
  const admin = User.findAdmin();
  if (admin) return User.verifyPassword(provided, admin.password_hash);
  // Fallback enquanto não existir utilizador na BD
  return provided === process.env.ADMIN_PASSWORD;
}

function requireAdmin(req, res, next) {
  if (!verifyAdminPassword(req.headers['x-admin-password'])) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  next();
}

// ── POST /admin/login ─────────────────────────────────────────────────────────

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (verifyAdminPassword(password)) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Password incorrecta.' });
});

// ── GET /admin/artworks ───────────────────────────────────────────────────────

router.get('/artworks', requireAdmin, (req, res) => {
  const artworks = db.prepare(`
    SELECT
      a.*,
      CASE WHEN a.auction_end > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_active,
      (SELECT COUNT(*) FROM bids WHERE artwork_id = a.id) AS total_bids,
      (SELECT MAX(amount) FROM bids WHERE artwork_id = a.id) AS top_bid
    FROM artworks a
    ORDER BY a.id DESC
  `).all();
  res.json(artworks);
});

// ── GET /admin/artworks/:id/bids ──────────────────────────────────────────────

router.get('/artworks/:id/bids', requireAdmin, (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  const bids = db.prepare(`
    SELECT
      b.id,
      b.amount,
      b.created_at,
      d.name,
      d.email,
      d.company,
      d.is_anonymous
    FROM bids b
    JOIN bidders d ON d.id = b.bidder_id
    WHERE b.artwork_id = ?
    ORDER BY b.created_at DESC
  `).all(req.params.id);

  res.json({ artwork, bids });
});

// ── POST /admin/artworks ──────────────────────────────────────────────────────

router.post('/artworks', requireAdmin, (req, res) => {
  const { title, artist, description, image, starting_price, auction_end } = req.body;

  if (!title?.trim() || !artist?.trim() || !starting_price || !auction_end) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, artist, starting_price, auction_end.' });
  }

  const price = Number(starting_price);
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'starting_price deve ser um número positivo.' });
  }

  if (!Artist.findByName(artist.trim())) {
    return res.status(400).json({ error: 'Artista não existe. Adicione primeiro o artista.' });
  }

  const result = db.prepare(`
    INSERT INTO artworks (title, artist, description, image, starting_price, current_price, auction_end)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    artist.trim(),
    description?.trim() || '',
    image?.trim() || '',
    price,
    price,
    auction_end,
  );

  res.status(201).json(Artwork.findById(result.lastInsertRowid));
});

// ── PUT /admin/artworks/:id ───────────────────────────────────────────────────

router.put('/artworks/:id', requireAdmin, (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  const { title, artist, description, image, starting_price, current_price, auction_end } = req.body;

  const newArtist = (artist ?? artwork.artist).trim();
  if (!Artist.findByName(newArtist)) {
    return res.status(400).json({ error: 'Artista não existe. Adicione primeiro o artista.' });
  }

  const sp = Number(starting_price ?? artwork.starting_price);
  const cp = Number(current_price  ?? artwork.current_price);

  db.prepare(`
    UPDATE artworks
    SET title = ?, artist = ?, description = ?, image = ?,
        starting_price = ?, current_price = ?, auction_end = ?
    WHERE id = ?
  `).run(
    (title ?? artwork.title).trim(),
    (artist ?? artwork.artist).trim(),
    (description ?? artwork.description ?? '').trim(),
    (image ?? artwork.image ?? '').trim(),
    sp, cp,
    auction_end ?? artwork.auction_end,
    artwork.id,
  );

  res.json(Artwork.findById(artwork.id));
});

// ── DELETE /admin/artworks/:id ────────────────────────────────────────────────

router.delete('/artworks/:id', requireAdmin, (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  // Remove em cascata (bids → bidders órfãos ficam, mas são inofensivos)
  db.prepare('DELETE FROM bids WHERE artwork_id = ?').run(artwork.id);
  db.prepare('DELETE FROM artworks WHERE id = ?').run(artwork.id);

  res.json({ message: 'Obra eliminada.' });
});

// ── GET /admin/artists ────────────────────────────────────────────────────────

router.get('/artists', requireAdmin, (req, res) => {
  res.json(Artist.findAll());
});

// ── POST /admin/artists ───────────────────────────────────────────────────────

router.post('/artists', requireAdmin, (req, res) => {
  const { name, photo, bio } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Campo obrigatório: name.' });
  }
  if (Artist.findByName(name.trim())) {
    return res.status(409).json({ error: 'Já existe um artista com esse nome.' });
  }

  const id = Artist.create({ name: name.trim(), photo: photo?.trim(), bio: bio?.trim() });
  res.status(201).json(Artist.findById(id));
});

// ── PUT /admin/artists/:id ────────────────────────────────────────────────────

router.put('/artists/:id', requireAdmin, (req, res) => {
  const artist = Artist.findById(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado.' });

  const { name, photo, bio } = req.body;
  const newName = (name ?? artist.name).trim();

  const conflict = Artist.findByName(newName);
  if (conflict && conflict.id !== artist.id) {
    return res.status(409).json({ error: 'Já existe um artista com esse nome.' });
  }

  Artist.update(artist.id, {
    name:  newName,
    photo: (photo ?? artist.photo ?? '').trim(),
    bio:   (bio ?? artist.bio ?? '').trim(),
  });

  res.json(Artist.findById(artist.id));
});

// ── DELETE /admin/artists/:id ─────────────────────────────────────────────────

router.delete('/artists/:id', requireAdmin, (req, res) => {
  const artist = Artist.findById(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado.' });

  Artist.delete(artist.id);
  res.json({ message: 'Artista eliminado.' });
});

module.exports = router;
