const http = require('http');

const data = JSON.stringify({
  name: 'Karan Mehra',
  email: 'karan@lemeridien.com',
  password: 'password123',
  restaurantName: 'Le Meridien Gourmet',
  address: 'Windsor Place, New Delhi',
  phone: '+91 11 2371 0101'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status Code:', res.statusCode);
    console.log('Registered User Payload:', JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(data);
req.end();
