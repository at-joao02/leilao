require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Router } = require('express');
const { Artwork, Artist, Bidder, Bid } = require('./models');
const { sendBidConfirmationToBuyer, sendBidNotificationToAdmin } = require('./mailer');

const router = Router();

const MIN_INCREMENT = Number(process.env.MIN_BID_INCREMENT) || 0;

// ── GET /artworks ─────────────────────────────────────────────────────────────

router.get('/artworks', (req, res) => {
  const artworks = Artwork.findAll();

  const result = artworks.map(a => ({
    ...a,
    countdown: buildCountdown(a.auction_end),
  }));

  res.json(result);
});

// ── GET /artists/:name ────────────────────────────────────────────────────────

router.get('/artists/:name', (req, res) => {
  const artist = Artist.findByName(req.params.name);
  if (!artist) return res.status(404).json({ error: 'Artista não encontrado.' });
  res.json(artist);
});

// ── GET /artworks/:id ─────────────────────────────────────────────────────────

router.get('/artworks/:id', (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  const bids = Bid.listForArtwork(artwork.id);
  const artists = Artwork.listArtists(artwork.id);

  res.json({
    ...artwork,
    countdown: buildCountdown(artwork.auction_end),
    artists,
    bids,
  });
});

// ── POST /artworks/:id/bid ────────────────────────────────────────────────────

router.post('/artworks/:id/bid', async (req, res) => {
  const artwork = Artwork.findById(req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Obra não encontrada.' });

  if (!artwork.is_active) {
    return res.status(400).json({ error: 'O leilão desta obra já encerrou.' });
  }

  const { name, email, company, amount, is_anonymous } = req.body;

  // ── Validação de campos obrigatórios ──
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'O valor do lance deve ser um número positivo.' });
  }

  // ── Validação do valor do lance ──
  const minRequired = artwork.current_price + MIN_INCREMENT;

  if (amount < minRequired) {
    const msg = MIN_INCREMENT > 0
      ? `O lance deve ser de pelo menos ${minRequired} (incremento mínimo: ${MIN_INCREMENT}).`
      : `O lance deve ser superior ao lance atual de ${artwork.current_price}.`;
    return res.status(400).json({ error: msg, minimum: minRequired });
  }

  // ── Gravar licitante e lance ──
  const bidderId = Bidder.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: company ? company.trim() : null,
    is_anonymous: Boolean(is_anonymous),
  });

  Bid.create({ artwork_id: artwork.id, bidder_id: bidderId, amount });
  Artwork.updateCurrentPrice(artwork.id, amount);

  // ── Envio de emails (não bloqueia a resposta se falhar) ──
  const emailJobs = [
    sendBidConfirmationToBuyer({
      to: email,
      name: name.trim(),
      artworkTitle: artwork.title,
      artist: artwork.artist,
      amount,
      auctionEnd: artwork.auction_end,
    }),
    sendBidNotificationToAdmin({
      artworkTitle: artwork.title,
      artist: artwork.artist,
      bidderName: name.trim(),
      bidderEmail: email,
      company: company || null,
      amount,
      isAnonymous: Boolean(is_anonymous),
    }),
  ];

  Promise.allSettled(emailJobs).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[mailer] email ${i} falhou:`, r.reason?.message);
      }
    });
  });

  res.status(201).json({
    message: 'Lance registado com sucesso.',
    artwork_id: artwork.id,
    new_price: amount,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCountdown(auctionEnd) {
  const remaining = new Date(auctionEnd) - new Date();
  if (remaining <= 0) return { expired: true, seconds: 0, formatted: 'Encerrado' };

  const totalSeconds = Math.floor(remaining / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days)    parts.push(`${days}d`);
  if (hours)   parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}min`);
  parts.push(`${seconds}s`);

  return { expired: false, seconds: totalSeconds, formatted: parts.join(' ') };
}

module.exports = router;
