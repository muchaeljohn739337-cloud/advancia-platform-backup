const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'advanciapayledger@gmail.com',
    pass: 'qmbk dljx rubt zihx',
  },
});

// POST /send-email
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and html or text',
      });
    }

    console.log(`📧 Sending email to ${to}...`);

    const info = await transporter.sendMail({
      from: '"Advancia Pay" <advanciapayledger@gmail.com>',
      to: to,
      subject: subject,
      html: html,
      text: text,
    });

    console.log('✅ Email sent!', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('❌ Email error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /status
app.get('/status', async (req, res) => {
  try {
    await transporter.verify();
    res.json({
      success: true,
      status: 'ready',
      message: 'Gmail SMTP is ready',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Email server running on http://localhost:${PORT}`);
  console.log(`📧 Send emails: POST http://localhost:${PORT}/send-email`);
  console.log(`✅ Check status: GET http://localhost:${PORT}/status`);
});
