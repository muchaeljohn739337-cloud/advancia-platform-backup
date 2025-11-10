import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL || 'advanciapayledger@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'avso gszp fjvj svmk',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from, text } = await request.json();

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    // Send email via Gmail SMTP
    const info = await transporter.sendMail({
      from: from || `"Advancia Pay" <${process.env.GMAIL_EMAIL || 'advanciapayledger@gmail.com'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully via Gmail' 
    });
  } catch (error: unknown) {
    console.error('Email send error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if email service is configured
export async function GET() {
  const isConfigured = !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
  
  return NextResponse.json({
    status: isConfigured ? 'ready' : 'not_configured',
    provider: 'Gmail SMTP',
    message: isConfigured 
      ? 'Email service is configured and ready (Gmail)'
      : 'Gmail credentials not configured',
  });
}
