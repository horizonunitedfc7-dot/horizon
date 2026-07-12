const http = require('http');

http.get('http://localhost:5000/uploads/passports/1783868005032-939970454.pdf', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY:', data));
});
