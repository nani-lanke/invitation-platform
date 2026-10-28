const handler = require('../api/export-jpg');

async function testApiExport() {
  console.log('Testing api/export-jpg directly...');

  const mockReq = {
    method: 'POST',
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    body: {
      eventType: 'wedding',
      brideName: 'Priya',
      groomName: 'Rahul',
      date: '2026-12-25',
      time: '18:30',
      venue: 'Royal Palace, Udaipur',
      template: 'royal-lake-palace'
    }
  };

  let responseHeaders = {};
  let statusCode = 200;
  let responseBody = null;

  const mockRes = {
    setHeader: (name, val) => { responseHeaders[name] = val; },
    status: (code) => { statusCode = code; return mockRes; },
    json: (obj) => { responseBody = obj; return mockRes; },
    send: (data) => { responseBody = data; return mockRes; }
  };

  try {
    await handler(mockReq, mockRes);
    console.log('Status Code:', statusCode);
    console.log('Headers:', responseHeaders);
    console.log('Response Body type:', Buffer.isBuffer(responseBody) ? 'Buffer (JPEG)' : typeof responseBody);
    console.log('Response Body length:', Buffer.isBuffer(responseBody) ? responseBody.length : JSON.stringify(responseBody).length);
    if (statusCode === 200 && Buffer.isBuffer(responseBody)) {
      require('fs').writeFileSync(require('path').join(__dirname, '../output_tests/verify-production-export.jpg'), responseBody);
      console.log('Saved JPEG output to output_tests/verify-production-export.jpg');
      console.log('SUCCESS: api/export-jpg successfully generated JPEG via Playwright!');
    } else {
      console.log('FAILURE: Unexpected response from api/export-jpg', responseBody);
    }
  } catch (err) {
    console.error('EXCEPTION in api/export-jpg test:', err);
  }
}

testApiExport();
