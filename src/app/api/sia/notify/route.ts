import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { name, phone, type, company, lookingFor, message } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Missing visitor data' },
        { status: 400 }
      );
    }

    // Format timestamp
    const now = new Date();
    const timeStr = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Check if Gmail is configured
    const isConfigured =
      GMAIL_USER &&
      GMAIL_APP_PASSWORD &&
      GMAIL_APP_PASSWORD !== 'your_app_password_here';

    if (!isConfigured) {
      console.log('========================================');
      console.log('📱 SIA VISITOR NOTIFICATION (Email not configured)');
      console.log('========================================');
      console.log(`👤 Name: ${name}`);
      console.log(`📞 Phone: ${phone || 'Not provided'}`);
      console.log(`🏢 Type: ${type || 'Not specified'}`);
      console.log(`🏛️  Company: ${company || 'Not specified'}`);
      console.log(`🔍 Looking For: ${lookingFor || 'Not specified'}`);
      console.log(`💬 Message: ${message || 'No message'}`);
      console.log(`🕐 Time: ${timeStr}`);
      console.log('========================================');

      return NextResponse.json({
        success: true,
        method: 'console',
        message: 'Logged to console (Email not configured)',
      });
    }

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    // Helper for info rows
    const infoRow = (emoji: string, label: string, value: string | null, color: string) => {
      if (!value) return '';
      return `
        <div style="margin-bottom: 16px; padding: 16px 20px; background: ${color}; border-radius: 12px;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${emoji} ${label}</p>
          <p style="margin: 0; font-size: 17px; font-weight: 600; color: #f1f5f9;">${value}</p>
        </div>
      `;
    };

    // Build HTML email
    const htmlBody = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); padding: 32px; text-align: center;">
          <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🤖</span>
          </div>
          <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">New Visitor Alert</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Someone visited your portfolio and talked to Sia</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 28px 24px;">
          ${infoRow('👤', 'Name', name, 'rgba(99,102,241,0.12)')}
          ${infoRow('📞', 'Phone Number', phone, 'rgba(16,185,129,0.12)')}
          ${infoRow('🏢', 'Visitor Type', type, 'rgba(245,158,11,0.12)')}
          ${infoRow('🏛️', 'Company', company, 'rgba(236,72,153,0.12)')}
          ${infoRow('🔍', 'Looking For', lookingFor, 'rgba(6,182,212,0.12)')}
          ${infoRow('💬', 'Message', message, 'rgba(168,85,247,0.12)')}
          
          <!-- Time -->
          <div style="margin-top: 8px; padding: 14px 20px; background: rgba(255,255,255,0.04); border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.06);">
            <p style="margin: 0; font-size: 13px; color: #64748b;">🕐 ${timeStr}</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 24px; border-top: 1px solid #1e293b; text-align: center; background: rgba(255,255,255,0.02);">
          <p style="margin: 0; font-size: 12px; color: #475569;">Sent from <strong style="color: #8b5cf6;">abinish.com</strong> via <strong style="color: #6366f1;">Sia AI</strong></p>
        </div>
      </div>
    `;

    // Build subject line
    let subject = `🤖 ${name} visited your portfolio`;
    if (type) subject += ` (${type})`;
    if (company) subject += ` — ${company}`;

    // Send email
    await transporter.sendMail({
      from: `"Sia AI 🤖" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject,
      html: htmlBody,
    });

    console.log('📧 Email notification sent for visitor:', name);

    return NextResponse.json({
      success: true,
      method: 'email',
    });
  } catch (error) {
    console.error('Notify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
