const checksum = require('checksum');
const mime = require('mime');
const https = require('https');
const path = require('path');
const fs = require('fs');

const DIR = 'assets';
const APIKEY = 'AXkWvaOoTaioeXIEvHHKAz';
const APPURL = 'https://ifct2017.herokuapp.com';
const IMGURL = `https://process.filestackapi.com/${APIKEY}/output=format:$tgt/${APPURL}/${DIR}/$fil`;
const IMGNAME = [];
if(!fs.existsSync(DIR)) fs.mkdirSync(DIR);

function image(txt, src='svg', tgt='jpg') {
  return new Promise((fres, frej) => {
    var fil = checksum(txt)+'.'+src;
    IMGNAME.push(fil);
    if(IMGNAME.length>1000) fs.unlink(path.join(DIR, IMGNAME.shift()), () => 0);
    fs.writeFile(path.join(DIR, fil), txt, (err) => {
      if(err) frej(err)
      fres(IMGURL.replace('$tgt', tgt).replace('$fil', fil));
    });
  });
};
module.exports = image;
