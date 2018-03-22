const checksum = require('checksum');
const mime = require('mime');
const https = require('https');
const path = require('path');
const fs = require('fs');

/*
const HOSTNAME = 'img42.com';
const ORIGIN = 'https://img42.com/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
*/
const E = process.env;
const DIR = 'assets';
const APIKEY = 'AXkWvaOoTaioeXIEvHHKAz';
const APPURL = E.URL? `https://${E.URL}`:'http://localhost';
const IMGURL = `https://process.filestackapi.com/${APIKEY}/output=format:$tgt/${APPURL}/${DIR}/$fil`;
/*
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
*/
var id = 0;
if(!fs.statSync(DIR).isDirectory()) fs.mkdirSync(DIR);

/*
function svgWidth(txt) {
  var m = txt.match(/width=\"(\d+)\"/);
  return parseFloat(m[1])||0;
};

function svgHeight(txt) {
  var m = txt.match(/height=\"(\d+)\"/);
  return parseFloat(m[1])||0;
};
*/

function image(txt, src='svg', tgt='jpg') {
  return new Promise((fres, frej) => {
    var fil = `${id++}.${src}`;
    if(id>=1000) fs.unlink(path.join(DIR, `${id-1000}.${src}`), () => 0);
    fs.writeFile(path.join(DIR, fil), txt, (err) => {
      if(err) frej(err)
      fres(IMGURL.replace('$tgt', tgt).replace('$fil', fil));
    });
  });
};

/*
function image(txt, src='svg', tgt='jpg', w=svgWidth(txt), h=svgHeight(txt)) {
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
*/
module.exports = image;
