const nutrients = require('@ifct2017/nutrients');
const fs = require('fs-extra');
const path = require('path');

function nutrients(db) {
  var dir = nutrients();
  return fs.readdir(dir).then((nams) => {
    var rdy = [];
    for(var nam of nams) {
      var fil = path.join(dir, nam);
      rdy.push();
    }
  });
};
