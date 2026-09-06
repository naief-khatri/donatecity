const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/donate/intent',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  cityId: "12345",
  gridX: 5,
  gridY: 5,
  buildingType: 'School',
  charityId: 'savethechildren',
  amount: 50
}));
req.end();
