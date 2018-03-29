const natural = require('natural');
const data = require('../../data');
const T = require('./type');

function match(typ, wrds, mth) {
  var val = wrds.slice(0, mth.length).join(' ');
  return {token: {type: typ, value: val}, length: mth.length};
};

function findLast(tkns, bgn, typ) {
  var z = -1;
  for(var i=bgn, I=tkns.length; i<I; z=i++)
    if(tkns[i].type!==typ) break;
  return z;
};

function processAt(db, wrds) {
  var tab = data.tableMatch(wrds);
  if(tab!=null) return Promise.resolve(match(T.TABLE, wrds, tab));
  return Promise.all([data.columnMatch(db, wrds), data.rowMatch(db, wrds)]).then((ans) => {
    var ca = ans[0]||[], ra = ans[1]||[];
    if(ra.length>ca.length) return match(T.ROW, wrds, ans[1]);
    return ca.length>0? match(T.COLUMN, wrds, ans[0]):null;
  });
};

async function process(db, tkns) {
  var wrds = tkns.map((v) => v.value.toLowerCase());
  for(var i=0, I=tkns.length, z=[]; i<I; i++) {
    var ent = await processAt(db, wrds.slice(i));
    if(ent!=null) { z.push(ent.token); i += ent.length-1; }
    else z.push(tkns[i]);
  }
  return z;
};

async function entity(db, tkns) {
  var rdy = [];
  for(var i=0, I=tkns.length; i<I; i++) {
    var j = findLast(tkns, i, T.TEXT);
    if(j<0) rdy.push(tkns[i]);
    else rdy.push(process(db, tkns.slice(i, (i=j)+1)));
  }
  return Promise.all(rdy).then((ans) => {
    for(var i=0, I=ans.length, z=[]; i<I; i++) {
      if(!Array.isArray(ans[i])) z.push(ans[i]);
      else z.push.apply(z, ans[i]);
    }
    return z;
  });
};
module.exports = entity;
