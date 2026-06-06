require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors    = require('cors');
const routes       = require('./routes');
const adminRoutes  = require('./admin.routes');

const { User } = require('./models');

const app  = express();
const PORT = process.env.PORT || 3000;

// Seed: cria o utilizador admin na BD a partir do .env, se ainda não existir
if (User.count() === 0 && process.env.ADMIN_PASSWORD) {
  User.create({
    email: process.env.ADMIN_EMAIL || 'admin@leilao.local',
    password: process.env.ADMIN_PASSWORD,
  });
  console.log(`Utilizador admin criado na base de dados (${process.env.ADMIN_EMAIL || 'admin@leilao.local'})`);
}

app.use(cors());
app.use(express.json({ limit: '10mb' })); // limite alargado para upload de fotografias em base64

// Ficheiros carregados (fotografias de artistas) — sob /api para passar no proxy do Nginx
app.use('/api/uploads', express.static(require('path').join(__dirname, '..', 'uploads')));

app.use('/api', routes);
app.use('/api/admin', adminRoutes); // API de admin sob /api para o proxy do Nginx
app.use('/admin', adminRoutes);     // compatibilidade com chamadas antigas

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((_, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  console.log(`  GET    /api/artworks`);
  console.log(`  GET    /api/artworks/:id`);
  console.log(`  POST   /api/artworks/:id/bid`);
  console.log(`  POST   /admin/login`);
  console.log(`  GET    /admin/artworks`);
  console.log(`  POST   /admin/artworks`);
  console.log(`  PUT    /admin/artworks/:id`);
  console.log(`  DELETE /admin/artworks/:id`);
  console.log(`  GET    /admin/artworks/:id/bids`);
});
