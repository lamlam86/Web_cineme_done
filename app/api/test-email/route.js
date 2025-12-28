import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// API test gửi email - chỉ dùng cho development
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp email nhận' },
        { status: 400 }
      );
    }

    // Log cấu hình (không log password)
    console.log('=== EMAIL CONFIG ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : '***NOT SET***');
    console.log('==================');

    // Kiểm tra cấu hình
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { 
          error: 'Thiếu cấu hình email',
          details: {
            SMTP_HOST: process.env.SMTP_HOST || 'NOT SET (default: smtp.gmail.com)',
            SMTP_PORT: process.env.SMTP_PORT || 'NOT SET (default: 587)',
            SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET (default: false)',
            SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET ❌',
            SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET ❌',
          }
        },
        { status: 500 }
      );
    }

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Test kết nối
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection successful!');

    // Gửi email test
    const info = await transporter.sendMail({
      from: `"LMK Cinema Test" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎬 Test Email - LMK Cinema',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #8b5cf6; text-align: center; }
            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .info { background: #e7f3ff; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎬 LMK Cinema</h1>
            <div class="success">
              <strong>✅ Email hoạt động tốt!</strong>
            </div>
            <div class="info">
              <p><strong>Thông tin test:</strong></p>
              <ul>
                <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
                <li>Gửi đến: ${email}</li>
                <li>SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}</li>
                <li>SMTP Port: ${process.env.SMTP_PORT || '587'}</li>
              </ul>
            </div>
            <p>Nếu bạn nhận được email này, có nghĩa là cấu hình email của bạn đã hoạt động đúng!</p>
            <div class="footer">
              <p>Email test từ LMK Cinema Booking System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Test email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Email test đã được gửi thành công!',
      messageId: info.messageId,
      sentTo: email,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
      }
    });

  } catch (error) {
    console.error('Email test error:', error);
    
    // Phân tích lỗi để đưa ra gợi ý
    let suggestion = '';
    if (error.code === 'EAUTH') {
      suggestion = 'Lỗi xác thực! Kiểm tra lại SMTP_USER và SMTP_PASS. Nếu dùng Gmail, cần sử dụng App Password thay vì mật khẩu thường.';
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      suggestion = 'Không thể kết nối đến SMTP server. Kiểm tra SMTP_HOST và SMTP_PORT.';
    } else if (error.code === 'EENVELOPE') {
      suggestion = 'Lỗi địa chỉ email. Kiểm tra định dạng email.';
    } else {
      suggestion = 'Kiểm tra lại toàn bộ cấu hình email trong file .env';
    }

    return NextResponse.json(
      { 
        error: 'Gửi email thất bại',
        message: error.message,
        code: error.code,
        suggestion: suggestion,
        config: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
          port: process.env.SMTP_PORT || '587 (default)',
          secure: process.env.SMTP_SECURE || 'false (default)',
          user: process.env.SMTP_USER || 'NOT SET',
          pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint để kiểm tra cấu hình (không gửi email)
export async function GET() {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET (default: smtp.gmail.com)',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET (default: 587)',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET (default: false)',
    SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET ❌',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET ✅' : 'NOT SET ❌',
  };

  const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    config,
    message: isConfigured 
      ? 'Cấu hình email đã được thiết lập. Sử dụng POST request để test gửi email.'
      : 'Thiếu cấu hình email. Vui lòng kiểm tra file .env',
  });
}

