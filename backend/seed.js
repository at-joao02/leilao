// Popula o banco com obras de arte de exemplo
const db = require('./db');

const artworks = [
  {
    title: 'Pôr do Sol sobre o Kwanza',
    artist: 'Lara Mendes',
    description: 'Óleo sobre tela que retrata o entardecer no rio Kwanza, com tons de laranja e violeta.',
    image: 'https://picsum.photos/seed/kwanza/800/600',
    starting_price: 15000,
    current_price: 15000,
    auction_end: offsetDays(7),
  },
  {
    title: 'Máscaras Tchokwe',
    artist: 'Paulo Sebastião',
    description: 'Aquarela contemporânea inspirada nas máscaras cerimoniais Tchokwe da Lunda Sul.',
    image: 'https://picsum.photos/seed/tchokwe/800/600',
    starting_price: 22000,
    current_price: 22000,
    auction_end: offsetDays(10),
  },
  {
    title: 'Mercado do Kinaxixe',
    artist: 'Ana Ferreira',
    description: 'Cena urbana em acrílico retratando a efervescência do histórico mercado de Luanda.',
    image: 'https://picsum.photos/seed/kinaxixe/800/600',
    starting_price: 18500,
    current_price: 18500,
    auction_end: offsetDays(5),
  },
  {
    title: 'Dança da Chuva',
    artist: 'Miguel Costa',
    description: 'Escultura em bronze de 40 cm representando uma dançarina em ritual de invocação da chuva.',
    image: 'https://picsum.photos/seed/chuva/800/600',
    starting_price: 35000,
    current_price: 35000,
    auction_end: offsetDays(14),
  },
  {
    title: 'Floresta do Mayombe',
    artist: 'Beatriz Nkosi',
    description: 'Pintura digital impressa em canvas mostrando a densa floresta tropical do Maiombe.',
    image: 'https://picsum.photos/seed/mayombe/800/600',
    starting_price: 12000,
    current_price: 12000,
    auction_end: offsetDays(3),
  },
  {
    title: 'Pesca em Cabinda',
    artist: 'Roberto Lopes',
    description: 'Fotografia artística em preto e branco de pescadores ao amanhecer em Cabinda.',
    image: 'https://picsum.photos/seed/cabinda/800/600',
    starting_price: 9000,
    current_price: 9000,
    auction_end: offsetDays(6),
  },
];

function offsetDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

const existing = db.prepare('SELECT COUNT(*) as n FROM artworks').get();
if (existing.n > 0) {
  console.log(`Banco já possui ${existing.n} obra(s). Seed ignorado.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO artworks (title, artist, description, image, starting_price, current_price, auction_end)
  VALUES (@title, @artist, @description, @image, @starting_price, @current_price, @auction_end)
`);

const insertMany = db.transaction(items => items.forEach(item => insert.run(item)));
insertMany(artworks);

console.log(`${artworks.length} obras inseridas com sucesso.`);
