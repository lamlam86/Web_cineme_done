import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function generateTicketQR(bookingCode, bookingId, bookingData = null) {
  try {
    const ticketInfo = bookingData ? {
      code: bookingCode,
      movie: bookingData.movie,
      branch: bookingData.branch,
      screen: bookingData.screen,
      showtime: bookingData.showtime,
      seats: bookingData.seats?.join(", "),
      total: bookingData.total_amount,
      status: "DA THANH TOAN"
    } : {
      code: bookingCode,
      id: bookingId,
      status: "DA THANH TOAN"
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(ticketInfo), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return qrCodeImage;
  } catch (error) {
    console.error('Error generating ticket QR:', error);
    throw error;
  }
}

function createTicketEmailHTML(booking, qrCodeImage) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vé xem phim - ${booking.booking_code}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #8b5cf6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #8b5cf6;
      margin: 0;
      font-size: 28px;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
      border-radius: 12px;
    }
    .qr-code {
      background: white;
      padding: 15px;
      border-radius: 8px;
      display: inline-block;
      margin: 15px 0;
    }
    .qr-code img {
      width: 250px;
      height: 250px;
      display: block;
    }
    .booking-code {
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin-top: 15px;
      letter-spacing: 2px;
    }
    .info-section {
      margin: 25px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .info-label {
      font-weight: 600;
      color: #666;
    }
    .info-value {
      color: #333;
      text-align: right;
    }
    .seats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .seat-badge {
      background: #8b5cf6;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 LMK Cinema</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Vé xem phim của bạn</p>
    </div>

    <div class="qr-section">
      <p style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
        📱 Mã QR vé của bạn
      </p>
      <div class="qr-code">
        <img src="${qrCodeImage}" alt="QR Code" />
      </div>
      <div class="booking-code">${booking.booking_code}</div>
      <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 14px;">
        Vui lòng đưa mã QR này cho nhân viên khi đến rạp
      </p>
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="info-label">🎬 Phim:</span>
        <span class="info-value"><strong>${booking.movie}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">📍 Rạp:</span>
        <span class="info-value">${booking.branch}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🎭 Phòng:</span>
        <span class="info-value">${booking.screen}</span>
      </div>
      <div class="info-row">
        <span class="info-label">📅 Ngày chiếu:</span>
        <span class="info-value">${formatDate(booking.showtime)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🕐 Giờ chiếu:</span>
        <span class="info-value"><strong>${formatTime(booking.showtime)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">💺 Ghế:</span>
        <span class="info-value">
          <div class="seats">
            ${booking.seats.map(seat => `<span class="seat-badge">${seat}</span>`).join('')}
          </div>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">💰 Tổng tiền:</span>
        <span class="info-value"><strong style="color: #8b5cf6; font-size: 18px;">${formatPrice(booking.total_amount)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">💳 Phương thức:</span>
        <span class="info-value">${booking.payment_method === 'bank_transfer' ? 'Chuyển khoản' : booking.payment_method === 'momo' ? 'Ví MoMo' : booking.payment_method === 'vnpay' ? 'VNPay' : 'Tiền mặt'}</span>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ Lưu ý quan trọng:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút</li>
        <li>Đưa mã QR này cho nhân viên để quét và nhận vé</li>
        <li>Mã QR chỉ có hiệu lực cho suất chiếu này</li>
        <li>Vui lòng không chia sẻ mã QR với người khác</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>LMK Cinema</strong></p>
      <p>Trụ sở: 84 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức</p>
      <p>Hotline: 1900 6017 | Email: info@lmkcinema.vn</p>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendTicketEmail(booking, userEmail, userName) {
  try {
    const qrCodeImage = await generateTicketQR(booking.booking_code, booking.id);
    const transporter = createTransporter();
    const html = createTicketEmailHTML(booking, qrCodeImage);

    const info = await transporter.sendMail({
      from: `"LMK Cinema" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `🎬 Vé xem phim ${booking.booking_code} - ${booking.movie}`,
      html: html,
      attachments: [
        {
          filename: `ticket-${booking.booking_code}.png`,
          content: qrCodeImage.split('base64,')[1],
          encoding: 'base64',
        },
      ],
    });

    console.log('Ticket email sent:', info.messageId);
    return { success: true, messageId: info.messageId, qrCode: qrCodeImage };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    throw error;
  }
}

function createResetPasswordEmailHTML(userName, resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu - LMK Cinema</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #8b5cf6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #8b5cf6;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin: 25px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #856404;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .link-text {
      word-break: break-all;
      color: #8b5cf6;
      font-size: 12px;
      margin-top: 15px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 LMK Cinema</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Đặt lại mật khẩu</p>
    </div>

    <div class="content">
      <p>Xin chào <strong>${userName}</strong>,</p>
      
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại LMK Cinema.</p>
      
      <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
      </div>
      
      <p>Hoặc copy và dán link sau vào trình duyệt:</p>
      <div class="link-text">${resetLink}</div>
      
      <div class="warning">
        <strong>⚠️ Lưu ý quan trọng:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
          <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
          <li>Để bảo mật, vui lòng không chia sẻ link này với bất kỳ ai</li>
        </ul>
      </div>
      
      <p>Nếu bạn không thể click vào nút, vui lòng copy link ở trên và dán vào trình duyệt.</p>
    </div>

    <div class="footer">
      <p><strong>LMK Cinema</strong></p>
      <p>Trụ sở: 84 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức</p>
      <p>Hotline: 1900 6017 | Email: info@lmkcinema.vn</p>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendResetPasswordEmail(userEmail, userName, resetToken) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const transporter = createTransporter();
    const html = createResetPasswordEmailHTML(userName || 'Khách hàng', resetLink);

    const info = await transporter.sendMail({
      from: `"LMK Cinema" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🔐 Đặt lại mật khẩu - LMK Cinema',
      html: html,
    });

    console.log('Reset password email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw error;
  }
}
