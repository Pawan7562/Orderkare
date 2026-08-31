const http = require('http');

const data = JSON.stringify({
  email: 'aman@spicewood.com',
  password: 'mypassword123'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Login Status Code:', res.statusCode);
    console.log('Login Response:', JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error('Login Error:', e);
});

req.write(data);
req.end();
