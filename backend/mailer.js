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

async function sendBidNotificationToAdmin({ artworkTitle, artist, bidderName, company, amount }) {
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
        <tr><td><strong>Licitante:</strong></td><td>${bidderName}</td></tr>
        ${companyLine}
      </table>
    `,
  });
}

module.exports = { sendBidNotificationToAdmin };
