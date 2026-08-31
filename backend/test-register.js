const http = require('http');

const data = JSON.stringify({
  name: 'Aman Sharma',
  email: 'aman@spicewood.com',
  password: 'mypassword123',
  restaurantName: 'Spicewood Bistro',
  address: 'Connaught Place, New Delhi',
  phone: '+91 99887 76655'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(data);
req.end();
