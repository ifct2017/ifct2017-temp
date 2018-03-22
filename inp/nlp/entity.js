const natural = require('natural');

const TABLE = new Map([
  ['compostion', 'compositions'],
  ['food', 'compositions']
]);
const COLUMN = new Map([
  ['everyth', '*'],
  ['complet', '*'],
  ['wholli', '*'],
  ['whole', '*'],
  ['total', '*'],
  ['entir', '*'],
  ['fulli', '*'],
  ['full', '*'],
  ['all', '*'],
  ['*', '*']
]);

function strCount(txt, ch) {
  for(var i=0, I=txt.length, z=0; i<I; i++)
    if(txt[i]===ch) z++;
  return z;
};

function table(wrds) {
  var stm = natural.PorterStemmer.stem(wrds[0]);
  if(TABLE.has(stm)) return TABLE.get(stm);
  return null;
};

function column(db, wrds) {
  var stm = natural.PorterStemmer.stem(wrds[0]);
  if(COLUMN.has(stm)) return Promise.resolve(COLUMN.get(stm));
  for(var i=wrds.length, j=1, sql='', args=[]; i>0; i--, j++) {
    sql += `SELECT "code", $${j}::TEXT AS x FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($${j}) UNION ALL `;
    args[j-1] = wrds.slice(0, i).join(' ');
  }
  return db.query(sql.substring(0, sql.length-11), args).then((ans) => ans.rowCount>0? ans.rows[0].x:null);
};

function row(db, wrds) {
  for(var i=wrds.length, j=1, sql='', args=[]; i>0; i--, j++) {
    sql += `SELECT "code", $${j}::TEXT AS x FROM "compositions_tsvector" WHERE "tsvector" @@ plainto_tsquery($${j}) UNION ALL `;
    args[j-1] = wrds.slice(0, i).join(' ');
  }
  return db.query(sql.substring(0, sql.length-11), args).then((ans) => ans.rowCount>0? ans.rows[0].x:null);
};

function findLast(tkns, bgn, typ) {
  var z = -1;
  for(var i=bgn, I=tkns.length; i<I; z=i++)
    if(tkns[i].type!==typ) break;
  return z;
};

function processAt(db, wrds) {
  var tab = table(wrds);
  if(tab!=null) return Promise.resolve({type: 'table', value: tab});
  return Promise.all([column(db, wrds), row(db, wrds)]).then((ans) => {
    var cl = ans[0]||'', rw = ans[1]||'';
    if(ans[0]==null && ans[1]==null) return null;
    if(rw.length>cl.length) return {type: 'row', value: rw};
    return {type: 'column', value: cl};
  });
};

async function process(db, tkns) {
  var wrds = tkns.map((v) => v.value.toLowerCase());
  for(var i=0, I=tkns.length, z=[]; i<I; i++) {
    var ent = await processAt(db, wrds);
    if(ent!=null) { z.push(ent); i += strCount(ent.value, ' '); }
    else z.push(tkns[i]);
  }
  return z;
};

async function entity(db, tkns) {
  var rdy = [];
  for(var i=0, I=tkns.length; i<I; i++) {
    var j = findLast(tkns, i, 'text');
    if(j<0) rdy.push(tkns[i]);
    else rdy.push(process(db, tkns.slice(i, j+1)));
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
