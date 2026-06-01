require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
  }).format(value);
}

async function sendBidConfirmationToBuyer({ to, name, artworkTitle, artist, amount, auctionEnd }) {
  const endDate = new Date(auctionEnd).toLocaleString('pt-AO', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  await transporter.sendMail({
    from: `"Leilão de Artes" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Lance registado — ${artworkTitle}`,
    html: `
      <h2>O seu lance foi registado com sucesso!</h2>
      <p>Olá, <strong>${name}</strong>.</p>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Obra:</strong></td><td>${artworkTitle}</td></tr>
        <tr><td><strong>Artista:</strong></td><td>${artist}</td></tr>
        <tr><td><strong>O seu lance:</strong></td><td>${formatCurrency(amount)}</td></tr>
        <tr><td><strong>Leilão termina:</strong></td><td>${endDate}</td></tr>
      </table>
      <p>Boa sorte!</p>
    `,
  });
}

async function sendBidNotificationToAdmin({ artworkTitle, artist, bidderName, bidderEmail, company, amount, isAnonymous }) {
  const displayName = isAnonymous ? 'Anónimo' : bidderName;
  const companyLine = company ? `<tr><td><strong>Empresa:</strong></td><td>${company}</td></tr>` : '';

  await transporter.sendMail({
    from: `"Leilão de Artes" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Novo lance — ${artworkTitle} — ${formatCurrency(amount)}`,
    html: `
      <h2>Novo lance recebido</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Obra:</strong></td><td>${artworkTitle}</td></tr>
        <tr><td><strong>Artista:</strong></td><td>${artist}</td></tr>
        <tr><td><strong>Valor:</strong></td><td>${formatCurrency(amount)}</td></tr>
        <tr><td><strong>Licitante:</strong></td><td>${displayName}</td></tr>
        ${isAnonymous ? '' : `<tr><td><strong>Email:</strong></td><td>${bidderEmail}</td></tr>`}
        ${companyLine}
        <tr><td><strong>Anónimo:</strong></td><td>${isAnonymous ? 'Sim' : 'Não'}</td></tr>
      </table>
    `,
  });
}

module.exports = { sendBidConfirmationToBuyer, sendBidNotificationToAdmin };
