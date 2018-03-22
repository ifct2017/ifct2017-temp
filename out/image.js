const checksum = require('checksum');
const mime = require('mime');
const https = require('https');
const path = require('path');
const fs = require('fs');

const DIR = 'assets';
const APIKEY = 'AXkWvaOoTaioeXIEvHHKAz';
const APPURL = 'https://ifct2017.herokuapp.com';
const IMGURL = `https://process.filestackapi.com/${APIKEY}/output=format:$tgt/${APPURL}/${DIR}/$fil`;

var id = 0;
if(!fs.existsSync(DIR)) fs.mkdirSync(DIR);

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
module.exports = image;
