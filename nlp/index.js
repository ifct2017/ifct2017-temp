const natural = require('natural');
const number = require('./number');
const unit = require('./unit');
const reserved = require('./reserved');
const entity = require('./entity');

const NULLORDER = [
  {c: ['keyword', 'SELECT', 'keyword', 'NULL', 'number/ordinal', 1], a: (s, t, i) => token('keyword', 'NULLS FIRST')},
  {c: ['keyword', 'SELECT', 'keyword', 'NULL', 'text', 'last'], a: (s, t, i) => token('keyword', 'NULLS LAST')},
];
const NUMBER = [
  {c: ['number/cardinal', null, 'number/ordinal', null], a: (s, t, i) => token('number/cardinal', t[i].value/t[i+1].value)},
  {c: ['number/cardinal', null, 'unit', null], a: (s, t, i) => token('number/cardinal', t[i].value*t[i+1].value)},
];
const LIMIT = [
  {c: ['keyword', 'LIMIT', 'number', null], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = false; }},
  {c: ['number', null, 'keyword', 'LIMIT'], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = false; }},
  {c: ['keyword', 'ASC', 'number', null], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = false; }},
  {c: ['number', null, 'keyword', 'ASC'], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = false; }},
  {c: ['keyword', 'DESC LIMIT', 'number', null], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = true; }},
  {c: ['number', null, 'keyword', 'DESC LIMIT'], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = true; }},
  {c: ['keyword', 'DESC', 'number', null], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = true; }},
  {c: ['number', null, 'keyword', 'DESC'], a: (s, t, i) => { s.limit = t[i+1].value; s.reverse = true; }},
];
const VALUE = [
  {c: ['operator', 'ALL', 'text', 'type', 'column', null], a: (s, t, i) => token('column', `all: ${t[i+2].value}`)},
  {c: ['operator', '+', 'text', 'type', 'column', null], a: (s, t, i) => token('column', `sum: ${t[i+2].value}`)},
  {c: ['function', 'avg', 'text', 'type', 'column', null], a: (s, t, i) => token('column', `avg: ${t[i+2].value}`)},
  {c: ['column', null, 'keyword', 'AS', 'unit/mass', null], a: (s, t, i) => token('expression', `("${t[i].value}/${t[i+1].value}")`)},
  {c: ['column', null, 'keyword', 'IN', 'unit/mass', null], a: (s, t, i) => token('expression', `("${t[i].value}/${t[i+1].value}")`)},
  {c: ['column', null], a: (s, t, i) => { token('expression', `"${t[i].value}"`); s.columnsUsed.push(t[i].value); return null; }},
  {c: ['number', null], a: (s, t, i) => token('expression', `${t[i].value}`)},
  {c: ['text', null], a: (s, t, i) => token('expression', `'${t[i].value}'`)},
  {c: ['keyword', 'FALSE'], a: (s, t, i) => token('expression', `FALSE`)},
  {c: ['keyword', 'TRUE'], a: (s, t, i) => token('expression', `TRUE`)},
  {c: ['keyword', 'NULL'], a: (s, t, i) => token('expression', `NULL`)},
];
const EXPRESSION = [
  {c: ['expression', null, 'operator/binary', null, 'expression', null, 'operator', 'ESCAPE', 'expression', null], a: (s, t, i) => token('expression', `${t[i].value} ${t[i+1].value} ${t[i+2].value} ESCAPE ${t[i+4].value}`)},
  {c: ['expression', null, 'operator/ternary', null, 'expression', null, 'operator', 'AND', 'expression', null], a: (s, t, i) => token('expression', `${t[i].value} ${t[i+1].value} ${t[i+2].value} AND ${t[i+4].value}`)},
  {c: ['expression', null, 'operator/ternary', null, 'expression', null, 'expression', null], a: (s, t, i) => token('expression', `${t[i].value} ${t[i+1].value} ${t[i+2].value} AND ${t[i+3].value}`)},
  {c: ['expression', null, 'operator/binary', null, 'expression', null], a: (s, t, i) => token('expression', `${t[i].value} ${t[i+1].value} ${t[i+2].value}`)},
  {c: ['expression', null, 'operator/unary', null], a: (s, t, i) => token('expression', `(${t[i].value} ${t[i+1].value})`)},
  {c: ['operator/unary', null, 'expression', null], a: (s, t, i) => token('expression', `(${t[i].value} ${t[i+1].value})`)},
  {c: ['expression', null, 'expression', null, 'bracket/close', null], a: (s, t, i) => [token('expression', `${t[i].value}, ${t[i+1].value}`), t[i+2]]},
  {c: ['function', null, 'bracket/open', null, 'expression', null, 'bracket/close', null], a: (s, t, i) => token('expression', `${t[i].value}(${t[i+2].value})`)},
  {c: ['function', null, 'expression', null], a: (s, t, i) => token('expression', `${t[i].value}(${t[i+1].value})`)},
  {c: ['bracket/open', null, 'expression', null, 'bracket/close', null], a: (s, t, i) => token('expression', `(${t[i+1].value})`)},
];
const HAVING = [
  {c: ['operator', 'AND', 'operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'OR', 'operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `OR (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'AND', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (${t[i].value})`; return null; }},
  {c: ['operator', 'OR', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `OR (${t[i].value})`; return null; }},
  {c: ['keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (${t[i].value})`; return null; }},
];
const WHERE = [
  {c: ['operator', 'AND', 'operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'OR', 'operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `OR (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (NOT ${t[i].value})`; return null; }},
  {c: ['operator', 'AND', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (${t[i].value})`; return null; }},
  {c: ['operator', 'OR', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `OR (${t[i].value})`; return null; }},
  {c: ['keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (${t[i].value})`; return null; }},
];
const ORDERBY = [
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'DESC', 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'} NULLS FIRST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'DESC', 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'} NULLS LAST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'ASC', 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'ASC', 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'DESC'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'DESC'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'ASC'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null, 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return t[i]; }},
  {c: ['keyword', 'ORDER BY', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return t[i]; }},
];
const GROUPBY = [
  {c: ['keyword', 'GROUP BY', 'expression', null], a: (s, t, i) => { s.groupBy.push(`${t[i+1].value}`); return t[i]; }},
];
const FROM = [
  {c: ['table', null], a: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
  {c: ['row', null], a: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
];
const COLUMN = [
  {c: ['keyword', 'DISTINCT', 'expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`DISTINCT ${t[i+1].value} AS ${t[i+3].value}`); return null; }},
  {c: ['keyword', 'ALL', 'expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`ALL ${t[i+1].value} AS ${t[i+3].value}`); return null; }},
  {c: ['keyword', 'DISTINCT', 'expression', null], a: (s, t, i) => { s.columns.push(`DISTINCT ${t[i+1].value}`); return null; }},
  {c: ['keyword', 'ALL', 'expression', null], a: (s, t, i) => { s.columns.push(`ALL ${t[i+1].value}`); return null; }},
  {c: ['expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`${t[i].value} AS ${t[i+2].value}`); return null; }},
  {c: ['expression', null], a: (s, t, i) => { s.columns.push(t[i].value); return null; }},
];

function stageRunAt(stg, sta, tkns, i) {
  stgi: for(var i=0, I=stg.length, T=tkns.length; i<I; i++) {
    var c = stg[i].c, a = stg[i].a, C = c.length/2;
    if(i+C>T) continue stgi;
    for(var j=0, J=C*2; j<J; j+=2)
      if(!tkns[i].type.startsWith(c[j]) || (c[j+1]!=null && !tkns.value.startsWith(c[j+1]))) continue stgi;
    return a(sta, tkns, i);
  }
  return null;
};

function stageRun(stg, sta, tkns, rpt=false) {
  var del = false, z = [];
  do {
    for(var i=0, I=tkns.length; i<I; i++) {
      var ans = stageRunAt(stg, sta, tkns, i);
      if(ans==null) continue;
      if(Array.isArray(ans)) z.push.apply(z, ans);
      else z.push(ans);
      del = true;
    }
  } while(rpt && del);
  return z;
};

function process(tkns) {
  var sta = {columns: [], from: [], groupBy: [], orderBy: [], where: '', having: '', limit: 0, columnsUsed: [], reverse: false};
  tkns = stageRun(NULLORDER, sta, tkns);
  tkns = stageRun(NUMBER, sta, tkns, true);
  tkns = stageRun(LIMIT, sta, tkns);
  tkns = stageRun(VALUE, sta, tkns);
  tkns = stageRun(EXPRESSION, sta, tkns, true);
  tkns = stageRun(HAVING, sta, tkns);
  tkns = stageRun(WHERE, sta, tkns);
  tkns = stageRun(ORDERBY, sta, tkns, true);
  tkns = stageRun(GROUPBY, sta, tkns, true);
  tkns = stageRun(FROM, sta, tkns);
  tkns = stageRun(COLUMN, sta, tkns);
  if(sta.having.startsWith('AND ')) sta.having = sta.having.substring(4);
  if(sta.where.startsWith('AND ')) sta.where = sta.where.substring(4);
  var i = sta.columns.indexOf(`"*"`);
  if(i>=0) sta.columns[i] = `*`;
  if(sta.columns.length===0 || !sta.columns.includes('*')) {
    for(var i=0, I=sta.columnsUsed.length; i<I; i++)
      if(!sta.columns.includes(sta.columnsUsed[i])) sta.columns.push(sta.columnsUsed[i]);
  }
  if(sta.columns.length===0) sta.columns.push(`*`);
  if(sta.from.length===0) sta.from.push(`"food"`);
  var z = `SELECT ${sta.columns.join(', ')} FROM ${sta.from.join(', ')}`;
  if(sta.groupBy.length>0) z += ` GROUP BY ${sta.groupBy.join(', ')}`;
  if(sta.orderBy.length>0) z += ` ORDER BY ${sta.orderBy.join(', ')}`;
  if(sta.where.length>0) z += ` WHERE ${sta.where}`;
  if(sta.having.length>0) z += ` HAVING ${sta.having}`;
  if(sta.limit>0) z += ` LIMIT ${sta.limit}`;
  return z;
};


// forty five hudred twelve
// ninety six million million thousand hundred ten
// thirthy five crore two lakh eithy one thousand
// one crore four fifty three thousand two seven six
// one crore four hundred fifty three thousand two seventy six
// nine four three seven one four five two three six
async function nlp(db) {
  var txt = 'which food has highest protein per gram';
  var wrds = new natural.WordTokenizer().tokenize(txt), tkns = [];
  for(var w of wrds)
    tkns.push({type: 'text', value: w});
  console.log(tkns);
  console.log();
  var stg1 = number(tkns);
  console.log(stg1);
  console.log();
  var stg2 = unit(stg1);
  console.log(stg2);
  console.log();
  var stg3 = reserved(stg2);
  console.log(stg3);
  console.log();
  var stg4 = await entity(db, stg3);
  console.log(stg4);
  console.log();
  var sql = process(stg4);
  console.log(sql);
  return sql;
};
module.exports = nlp;
