/**
 * Cron job script để kiểm tra thanh toán tự động
 * Chạy script này bằng: node scripts/check-payments.js
 * Hoặc setup với cron: */5 * * * * node /path/to/scripts/check-payments.js
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function checkPayments() {
  try {
    const url = new URL(`${API_URL}/api/cron/check-payments`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = protocol.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('Payment check result:', result);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
  } catch (error) {
    console.error('Error checking payments:', error);
    throw error;
  }
}

// Chạy script
if (require.main === module) {
  checkPayments()
    .then(() => {
      console.log('Payment check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Payment check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPayments };





