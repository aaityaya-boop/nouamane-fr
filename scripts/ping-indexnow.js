const https = require('https');

const host = 'api.indexnow.org';
const key = '43715d95bd484e2d81f420fec5781aab';
const keyLocation = `https://nayparfum.ma/${key}.txt`;

const urlList = [
  'https://nayparfum.ma',
  'https://nayparfum.ma/fr',
  'https://nayparfum.ma/fr/shop',
  'https://nayparfum.ma/fr/shop/men',
  'https://nayparfum.ma/fr/shop/women',
  'https://nayparfum.ma/fr/shop/unisex',
  'https://nayparfum.ma/fr/shop/oriental',
  'https://nayparfum.ma/fr/testeurs',
  'https://nayparfum.ma/fr/testeurs/men',
  'https://nayparfum.ma/fr/testeurs/women',
  'https://nayparfum.ma/fr/parfums-originaux',
  'https://nayparfum.ma/fr/master-copier',
  'https://nayparfum.ma/fr/coffrets',
  'https://nayparfum.ma/fr/blog',
  'https://nayparfum.ma/fr/blog/difference-testeur-original'
];

const postData = JSON.stringify({
  host: 'nayparfum.ma',
  key: key,
  keyLocation: keyLocation,
  urlList: urlList
});

const options = {
  hostname: host,
  path: '/IndexNow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('✅ Successfully submitted URLs to Bing IndexNow with key: ' + key);
    } else {
      console.log(`❌ Failed to submit to IndexNow. Status code: ${res.statusCode}`);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
