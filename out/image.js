const checksum = require('checksum');
const mime = require('mime');
const https = require('https');

const HOSTNAME = 'img42.com';
const ORIGIN = 'https://img42.com/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const FILESTACK_KEY = 'AXkWvaOoTaioeXIEvHHKAz';
const OPTIONS = {
  hostname: 'img42.com',
  method: 'POST',
  headers: {
    'Origin': 'https://img42.com/',
    'Referrer': 'https://img42.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Content-Type': 'raw'
  }
};

function image(txt, src='svg', tgt='jpg', w=0, h=0) {
  var hdr = {'Origin': ORIGIN, 'Referrer': ORIGIN, 'User-Agent': USER_AGENT, 'Content-Length': txt.length, 'Content-Type': 'raw'};
  var opt = {hostname: HOSTNAME, method: 'POST', path: `/api/image?width=${w}&height=${h}&type=${encodeURIComponent(mime.getType(src))}&checksum=${checksum(txt)}`, headers: hdr};
  return new Promise((fres, frej) => {
    var req = https.request(opt, (res) => {
      var buf = '';
      res.on('data', (chk) => buf += chk);
      res.on('end', () => fres(`https://process.filestackapi.com/${FILESTACK_KEY}/output=format:${tgt}/https://img42.com/${JSON.parse(buf).alias}+`));
    });
    req.on('error', frej);
    req.write(txt);
    req.end();
  });
};
module.exports = image;
