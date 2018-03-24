const natural = require('natural');

const IGNORE = /^(a|an|the|i|he|him|she|her|they|their|as|at|if|in|is|it|of|on|to|by|want|well|than|then|thus|however|ok|okay)$/;
const TABLE = new Map([
  ['compositions_tsvector', 'compositions_tsvector'],
  ['composit', 'compositions_tsvector'],
  ['compon', 'compositions_tsvector'],
  ['nutrient', 'compositions_tsvector'],
  ['food', 'compositions_tsvector'],
  ['columns_tsvector', 'columns_tsvector'],
  ['column', 'columns_tsvector'],
  ['abbreviations_tsvector', 'abbreviations_tsvector'],
  ['abbrevi', 'abbreviations_tsvector'],
  ['acronym', 'abbreviations_tsvector'],
  ['compositingcentres_tsvector', 'compositingcentres_tsvector'],
  ['compositingcentr', 'compositingcentres_tsvector'],
  ['centr composit', 'compositingcentres_tsvector'],
  ['area composit', 'compositingcentres_tsvector'],
  ['frequencydistribution_tsvector', 'frequencydistribution_tsvector'],
  ['frequencydistribut', 'frequencydistribution_tsvector'],
  ['frequenc', 'frequencydistribution_tsvector'],
  ['distribut', 'frequencydistribution_tsvector'],
  ['groups_tsvector', 'groups_tsvector'],
  ['group', 'groups_tsvector'],
  ['food group', 'groups_tsvector'],
  ['methods_tsvector', 'methods_tsvector'],
  ['method', 'methods_tsvector'],
  ['analyt method', 'methods_tsvector'],
  ['analysi', 'methods_tsvector'],
  ['measur method', 'methods_tsvector'],
  ['measur', 'methods_tsvector'],
  ['regions_tsvector', 'regions_tsvector'],
  ['region', 'regions_tsvector'],
  ['samplingunits_tsvector', 'samplingunits_tsvector'],
  ['samplingunit', 'samplingunits_tsvector'],
  ['sampl unit', 'samplingunits_tsvector'],
  ['primari sampl unit', 'samplingunits_tsvector'],
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

function table(txt) {
  txt = txt.split(' ').filter((v) => !IGNORE.test(v)).map(natural.PorterStemmer.stem).sort().join(' ');
  return TABLE.get(txt);
};

function tableMatch(wrds) {
  wrds = wrds.map(natural.PorterStemmer.stem);
  for(var i=wrds.length; i>0; i--) {
    var txt = wrds.filter((v) => !IGNORE.test(v)).sort().join(' ');
    if(TABLE.has(txt)) return {value: TABLE.get(txt), length: i};
  }
  return null;
};

function column(db, txt, srt=false) {
  var col = COLUMN.get(natural.PorterStemmer.stem(txt));
  if(col!=null) return Promise.resolve(col);
  var ord = ' ORDER BY ts_rank("tsvector", plainto_tsquery($1), 16) DESC LIMIT 1', nrm = ' LIMIT 1';
  var sql = 'SELECT "code" FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)'+(srt? ord:nrm);
  return db.query(sql, [txt]).then((ans) => ans.rowCount>0? ans.rows[0].code:null);
};

function columns(db, txt, srt=false) {
  var col = COLUMN.get(natural.PorterStemmer.stem(txt));
  if(col!=null) return Promise.resolve([col]);
  var ord = ' ORDER BY ts_rank("tsvector", plainto_tsquery($1), 16) DESC';
  var sql = 'SELECT "code" FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)'+(srt? ord:'');
  return db.query(sql, [txt]).then((ans) => ans.rowCount>0? ans.rows.map((v) => v.code):null);
};

function columnMatch(db, wrds) {
  var col = COLUMN.get(natural.PorterStemmer.stem(txt));
  if(col!=null) return Promise.resolve(col);
  for(var i=wrds.length, p=1, sql='', par=[]; i>0; i--, p+=2) {
    sql += `SELECT "code", $${p}::INT AS i FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($${p+1}) UNION ALL `;
    par.push(i, wrds.join(' ')); wrds.pop();
  }
  sql = sql.substring(0, sql.length-11);
  return db.query(sql, par).then((ans) => ans.rowCount>0? {value: ans.rows[0].code, length: ans.rows[0].i}:null);
};

function row(db, txt, srt=false) {
  var ord = ' ORDER BY ts_rank("tsvector", plainto_tsquery($1), 16) DESC LIMIT 1', nrm = ' LIMIT 1';
  var sql = 'SELECT "code" FROM "compositions_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)'+(srt? ord:nrm);
  return db.query(sql, [txt]).then((ans) => ans.rowCount>0? ans.rows[0].code:null);
};

function rows(db, txt, srt=false) {
  var ord = ' ORDER BY ts_rank("tsvector", plainto_tsquery($1), 16) DESC';
  var sql = 'SELECT "code" FROM "compositions_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)'+(srt? ord:'');
  return db.query(sql, [txt]).then((ans) => ans.rowCount>0? ans.rows.map((v) => v.code):null);
};

function rowMatch(db, wrds) {
  for(var i=wrds.length, p=1, sql='', par=[]; i>0; i--, p+=2) {
    sql += `SELECT "code", $${p}::INT AS i FROM "compositions_tsvector" WHERE "tsvector" @@ plainto_tsquery($${p+1}) UNION ALL `;
    par.push(i, wrds.join(' ')); wrds.pop();
  }
  sql = sql.substring(0, sql.length-11);
  return db.query(sql, par).then((ans) => ans.rowCount>0? {value: ans.rows[0].code, length: ans.rows[0].i}:null);
};
module.exports = {table, tableMatch, column, columns, columnMatch, row, rows, rowMatch};
