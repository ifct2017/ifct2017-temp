const natural = require('natural');
const data = require('../../data');
const T = require('./type');

const TYPES = [
  T.COLUMN,
  T.ROW,
  T.TABLE,
];

function match(typ, wrds, mth) {
  var val = wrds.slice(0, mth.length).join(' ');
  return {token: {type: typ, value: val}, length: mth.length};
};

function findLast(tkns, bgn, typ) {
  var z = -1;
  for(var i=bgn, I=tkns.length; i<I; z=i++)
    if(tkns[i].type>typ) break;
  return z;
};

function processAt(db, wrds) {
  var rdy = [data.columnMatch(db, wrds), data.rowMatch(db, wrds), Promise.resolve(data.tableMatch(wrds))];
  return Promise.all(rdy).then((ans) => {
    var mi = (ans[1]||[]).length>(ans[0]||[]).length? 1:0;
    mi = (ans[2]||[]).length>(ans[mi]||[]).length? 2:mi;
    return (ans[mi]||[]).length>0? match(TYPES[mi], wrds, ans[mi]):null;
  });
};

async function process(db, tkns) {
  var wrds = tkns.map((v) => v.value.toString().toLowerCase());
  for(var i=0, I=tkns.length, z=[]; i<I; i++) {
    var ent = await processAt(db, wrds.slice(i));
    var isnum = tkns.slice(i).every((t) => t.type>=T.NUMBER && t.type<=T.ORDINAL);
    if(ent!=null && !isnum) { z.push(ent.token); i += ent.length-1; }
    else z.push(tkns[i]);
  }
  return z;
};

async function entity(db, tkns) {
  var rdy = [];
  for(var i=0, I=tkns.length; i<I; i++) {
    var j = findLast(tkns, i, T.ORDINAL);
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
