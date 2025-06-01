const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // ou outro: Outlook, SMTP personalizado, etc
  auth: {
    user: 'solarespaineis01@gmail.com',
    pass: 'mcla lyve nkqr ljdw'
  }
});

async function sendEmail({ to, subject, text }) {
  await transporter.sendMail({
    from: `"Energia Solar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
}

module.exports = sendEmail;
