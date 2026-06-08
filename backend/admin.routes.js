require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { Artwork, Artist, User } = require('./models');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Guarda uma imagem enviada como data URL base64 e devolve o caminho público.
 * Devolve null se não houver dados; lança Error em formato/tamanho inválido.
 */
function saveUploadedImage(subdir, baseName, dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error('Formato de imagem inválido (use JPEG, PNG ou WebP).');

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_PHOTO_BYTES) throw new Error('Imagem demasiado grande (máx. 5 MB).');

  const dir = path.join(UPLOADS_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  removeUploadedImage(subdir, baseName);

  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const file = `${baseName}.${ext}`;
  fs.writeFileSync(path.join(dir, file), buf);
  return `/api/uploads/${subdir}/${file}`;
}

function removeUploadedImage(subdir, baseName) {
  const dir = path.join(UPLOADS_ROOT, subdir);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(`${baseName}.`)) fs.unlinkSync(path.join(dir, f));
  }
}

const saveArtistPhoto   = (id, dataUrl) => saveUploadedImage('artists', `artist-${id}`, dataUrl);
const removeArtistPhoto = (id)          => removeUploadedImage('artists', `artist-${id}`);
const saveArtworkImage   = (id, dataUrl) => saveUploadedImage('artworks', `artwork-${id}`, dataUrl);
const removeArtworkImage = (id)          => removeUploadedImage('artworks', `artwork-${id}`);

/**
 * Resolve a lista de artistas de uma obra a partir de artist_ids (preferido)
 * ou do nome único em `artist`. Devolve { rows } ou { error }.
 */
function resolveArtists({ artist_ids, artist }) {
  if (Array.isArray(artist_ids) && artist_ids.length > 0) {
    const rows = artist_ids.map(id => Artist.findById(id));
    if (rows.some(r => !r)) return { error: 'Um ou mais artistas não existem.' };
    return { rows };
  }
  if (artist?.trim()) {
    const row = Artist.findByName(artist.trim());
    if (!row) return { error: 'Artista não existe. Adicione primeiro o artista.' };
    return { rows: [row] };
  }
  return { error: 'Seleccione pelo menos um artista.' };
}

function setArtworkArtists(artworkId, artistRows) {
  db.prepare('DELETE FROM artwork_artists WHERE artwork_id = ?').run(artworkId);
  const ins = db.prepare('INSERT INTO artwork_artists (artwork_id, artist_id) VALUES (?, ?)');
  for (const r of artistRows) ins.run(artworkId, r.id);
}

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
      (SELECT MAX(amount) FROM bids WHERE artwork_id = a.id) AS top_bid,
      (SELECT GROUP_CONCAT(artist_id) FROM artwork_artists WHERE artwork_id = a.id) AS artist_ids
    FROM artworks a
    ORDER BY a.id DESC
  `).all();
  res.json(artworks.map(a => ({
    ...a,
    artist_ids: a.artist_ids ? String(a.artist_ids).split(',').map(Number) : [],
  })));
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
      d.phone
    FROM bids b
    JOIN bidders d ON d.id = b.bidder_id
    WHERE b.artwork_id = ?
    ORDER BY b.created_at DESC
  `).all(req.params.id);

  res.json({ artwork, bids });
});

// ── POST /admin/artworks ──────────────────────────────────────────────────────

router.post('/artworks', requireAdmin, (req, res) => {
  const { title, artist, artist_ids, description, image, image_data, starting_price, auction_end, dimensions } = req.body;

  if (!title?.trim() || !starting_price || !auction_end) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, starting_price, auction_end.' });
  }

  const price = Number(starting_price);
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'starting_price deve ser um número positivo.' });
  }

  const resolved = resolveArtists({ artist_ids, artist });
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  const artistNames = resolved.rows.map(r => r.name).join(', ');

  const result = db.prepare(`
    INSERT INTO artworks (title, artist, description, image, starting_price, current_price, auction_end, dimensions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    artistNames,
    description?.trim() || '',
    image?.trim() || '',
    price,
    price,
    auction_end,
    dimensions?.trim() || '',
  );

  const id = result.lastInsertRowid;
  setArtworkArtists(id, resolved.rows);

  if (image_data) {
    try {
      const saved = saveArtworkImage(id, image_data);
      db.prepare('UPDATE artworks SET image = ? WHERE id = ?').run(saved, id);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.status(201).json(Artwork.findById(id));
});

// ── PUT /admin/artworks/:id ───────────────────────────────────────────────────

router.put('/artworks/:id', requireAdmin, (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  const { title, artist, artist_ids, description, image, image_data, starting_price, current_price, auction_end, dimensions } = req.body;

  // Artistas: se vierem ids (ou nome), revalida e substitui; senão mantém os atuais
  let artistNames = artwork.artist;
  if ((Array.isArray(artist_ids) && artist_ids.length > 0) || artist?.trim()) {
    const resolved = resolveArtists({ artist_ids, artist });
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    artistNames = resolved.rows.map(r => r.name).join(', ');
    setArtworkArtists(artwork.id, resolved.rows);
  }

  let newImage = (image ?? artwork.image ?? '').trim();
  if (image_data) {
    try {
      newImage = saveArtworkImage(artwork.id, image_data);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  const sp = Number(starting_price ?? artwork.starting_price);
  const cp = Number(current_price  ?? artwork.current_price);

  db.prepare(`
    UPDATE artworks
    SET title = ?, artist = ?, description = ?, image = ?,
        starting_price = ?, current_price = ?, auction_end = ?, dimensions = ?
    WHERE id = ?
  `).run(
    (title ?? artwork.title).trim(),
    artistNames,
    (description ?? artwork.description ?? '').trim(),
    newImage,
    sp, cp,
    auction_end ?? artwork.auction_end,
    (dimensions ?? artwork.dimensions ?? '').trim(),
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
  db.prepare('DELETE FROM artwork_artists WHERE artwork_id = ?').run(artwork.id);
  db.prepare('DELETE FROM artworks WHERE id = ?').run(artwork.id);
  removeArtworkImage(artwork.id);

  res.json({ message: 'Obra eliminada.' });
});

// ── GET /admin/artists ────────────────────────────────────────────────────────

router.get('/artists', requireAdmin, (req, res) => {
  res.json(Artist.findAll());
});

// ── POST /admin/artists ───────────────────────────────────────────────────────

router.post('/artists', requireAdmin, (req, res) => {
  const { name, photo, bio, photo_data } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Campo obrigatório: name.' });
  }
  if (Artist.findByName(name.trim())) {
    return res.status(409).json({ error: 'Já existe um artista com esse nome.' });
  }

  const id = Artist.create({ name: name.trim(), photo: photo?.trim(), bio: bio?.trim() });

  if (photo_data) {
    try {
      const saved = saveArtistPhoto(id, photo_data);
      Artist.update(id, { name: name.trim(), photo: saved, bio: bio?.trim() });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.status(201).json(Artist.findById(id));
});

// ── PUT /admin/artists/:id ────────────────────────────────────────────────────

router.put('/artists/:id', requireAdmin, (req, res) => {
  const artist = Artist.findById(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado.' });

  const { name, photo, bio, photo_data } = req.body;
  const newName = (name ?? artist.name).trim();

  const conflict = Artist.findByName(newName);
  if (conflict && conflict.id !== artist.id) {
    return res.status(409).json({ error: 'Já existe um artista com esse nome.' });
  }

  let newPhoto = (photo ?? artist.photo ?? '').trim();
  if (photo_data) {
    try {
      newPhoto = saveArtistPhoto(artist.id, photo_data);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  Artist.update(artist.id, {
    name:  newName,
    photo: newPhoto,
    bio:   (bio ?? artist.bio ?? '').trim(),
  });

  res.json(Artist.findById(artist.id));
});

// ── DELETE /admin/artists/:id ─────────────────────────────────────────────────

router.delete('/artists/:id', requireAdmin, (req, res) => {
  const artist = Artist.findById(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado.' });

  removeArtistPhoto(artist.id);
  Artist.delete(artist.id);
  res.json({ message: 'Artista eliminado.' });
});

module.exports = router;
