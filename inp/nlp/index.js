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
  {c: ['operator', 'ALL', 'keyword', 'TYPE', 'column', null], a: (s, t, i) => token('column', `all: ${t[i+2].value}`)},
  {c: ['operator', '+', 'keyword', 'TYPE', 'column', null], a: (s, t, i) => token('column', `sum: ${t[i+2].value}`)},
  {c: ['function', 'avg', 'keyword', 'TYPE', 'column', null], a: (s, t, i) => token('column', `avg: ${t[i+2].value}`)},
  {c: ['column', null, 'keyword', 'PER', 'number/cardinal', null], a: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token('expression', `("${t[i].value}"*${t[i+2].value/100})`); }},
  {c: ['column', null, 'keyword', 'PER', 'unit', null], a: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token('expression', `("${t[i].value}"*${t[i+2].value/100})`); }},
  {c: ['column', null, 'keyword', 'AS', 'unit', null], a: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token('expression', `("${t[i].value}"/${t[i+1].value})`); }},
  {c: ['column', null, 'keyword', 'IN', 'unit', null], a: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token('expression', `("${t[i].value}"/${t[i+1].value})`); }},
  {c: ['column', null], a: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token('expression', `"${t[i].value}"`); }},
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
const ORDERBY = [
  {c: ['keyword', 'ORDER BY', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return t[i]; }},
  {c: ['expression', null, 'keyword', 'DESC', 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'} NULLS FIRST`); return null; }},
  {c: ['expression', null, 'keyword', 'DESC', 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'} NULLS LAST`); return null; }},
  {c: ['expression', null, 'keyword', 'ASC', 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return null; }},
  {c: ['expression', null, 'keyword', 'ASC', 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return null; }},
  {c: ['keyword', 'DESC', 'expression', null, 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'} NULLS FIRST`); return null; }},
  {c: ['keyword', 'DESC', 'expression', null, 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'} NULLS LAST`); return null; }},
  {c: ['keyword', 'ASC', 'expression', null, 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return null; }},
  {c: ['keyword', 'ASC', 'expression', null, 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return null; }},
  {c: ['expression', null, 'keyword', 'NULLS FIRST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return null; }},
  {c: ['expression', null, 'keyword', 'NULLS LAST'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return null; }},
  {c: ['keyword', 'NULLS FIRST', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS FIRST`); return null; }},
  {c: ['keyword', 'NULLS LAST', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} NULLS LAST`); return null; }},
  {c: ['expression', null, 'keyword', 'DESC'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {c: ['keyword', 'DESC', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {c: ['expression', null, 'keyword', 'ASC'], a: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
  {c: ['keyword', 'ASC', 'expression', null], a: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
];
const GROUPBY = [
  {c: ['keyword', 'GROUP BY', 'expression', null], a: (s, t, i) => { s.groupBy.push(`${t[i+1].value}`); return t[i]; }},
];
const HAVING = [
  {c: ['operator', 'AND', 'operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (NOT ${t[i+3].value})`; return null; }},
  {c: ['operator', 'OR', 'operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `OR (NOT ${t[i+3].value})`; return null; }},
  {c: ['operator', 'NOT', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (NOT ${t[i+2].value})`; return null; }},
  {c: ['operator', 'AND', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (${t[i+2].value})`; return null; }},
  {c: ['operator', 'OR', 'keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `OR (${t[i+2].value})`; return null; }},
  {c: ['keyword', 'HAVING', 'expression', null], a: (s, t, i) => { s.having += `AND (${t[i+1].value})`; return null; }},
];
const WHERE = [
  {c: ['operator', 'AND', 'operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (NOT ${t[i+3].value})`; return null; }},
  {c: ['operator', 'OR', 'operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `OR (NOT ${t[i+3].value})`; return null; }},
  {c: ['operator', 'NOT', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (NOT ${t[i+2].value})`; return null; }},
  {c: ['operator', 'AND', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (${t[i+2].value})`; return null; }},
  {c: ['operator', 'OR', 'keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `OR (${t[i+2].value})`; return null; }},
  {c: ['keyword', 'WHERE', 'expression', null], a: (s, t, i) => { s.where += `AND (${t[i+1].value})`; return null; }},
];
const FROM = [
  {c: ['table', null], a: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
  {c: ['row', null], a: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
];
const COLUMN = [
  {c: ['keyword', 'SELECT', 'keyword', 'DISTINCT', 'expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`DISTINCT ${t[i+2].value} AS ${t[i+4].value}`); return t[i]; }},
  {c: ['keyword', 'SELECT', 'keyword', 'ALL', 'expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`ALL ${t[i+2].value} AS ${t[i+4].value}`); return t[i]; }},
  {c: ['keyword', 'SELECT', 'keyword', 'DISTINCT', 'expression', null], a: (s, t, i) => { s.columns.push(`DISTINCT ${t[i+2].value}`); return t[i]; }},
  {c: ['keyword', 'SELECT', 'keyword', 'ALL', 'expression', null], a: (s, t, i) => { s.columns.push(`ALL ${t[i+2].value}`); return t[i]; }},
  {c: ['keyword', 'SELECT', 'expression', null, 'keyword', 'AS', 'expression', null], a: (s, t, i) => { s.columns.push(`${t[i+1].value} AS ${t[i+3].value}`); return t[i]; }},
  {c: ['keyword', 'SELECT', 'expression', null], a: (s, t, i) => { s.columns.push(t[i+1].value); return t[i]; }},
];

function token(type, value) {
  return {type, value};
};

function stageRunAt(stg, sta, tkns, i) {
  stgs: for(var s=0, S=stg.length, T=tkns.length; s<S; s++) {
    var c = stg[s].c, a = stg[s].a, C = c.length/2;
    if(i+C>T) continue stgs;
    for(var j=0; j<C; j++) {
      if(!tkns[i+j].type.startsWith(c[j*2]) || (c[j*2+1]!=null && !tkns[i+j].value.startsWith(c[j*2+1]))) continue stgs;
    }
    return {tokens: a(sta, tkns, i)||[], length: C};
  }
  return null;
};

function stageRun(stg, sta, tkns, rpt=false) {
  do {
    var del = false, z = [];
    for(var i=0, I=tkns.length; i<I;) {
      var ans = stageRunAt(stg, sta, tkns, i);
      if(ans==null) { z.push(tkns[i++]); continue; }
      if(!Array.isArray(ans.tokens)) z.push(ans.tokens);
      else z.push.apply(z, ans.tokens);
      i += ans.length;
      del = true;
    }
    tkns = z;
  } while(rpt && del);
  return z;
};

function process(tkns) {
  var sta = {columns: [], from: [], groupBy: [], orderBy: [], where: '', having: '', limit: 0, columnsUsed: [], reverse: false};
  tkns = stageRun(NULLORDER, sta, tkns);
  tkns = stageRun(NUMBER, sta, tkns, true);
  tkns = stageRun(LIMIT, sta, tkns);
  tkns = stageRun(VALUE, sta, tkns, true);
  tkns = stageRun(EXPRESSION, sta, tkns, true);
  tkns = stageRun(ORDERBY, sta, tkns, true);
  tkns = stageRun(GROUPBY, sta, tkns, true);
  tkns = stageRun(HAVING, sta, tkns);
  tkns = stageRun(WHERE, sta, tkns);
  tkns = stageRun(FROM, sta, tkns);
  tkns = stageRun(COLUMN, sta, tkns, true);
  console.log('columns', sta.columns);
  console.log('columnsUsed', sta.columnsUsed);
  if(sta.having.startsWith('AND ')) sta.having = sta.having.substring(4);
  if(sta.where.startsWith('AND ')) sta.where = sta.where.substring(4);
  var i = sta.columns.indexOf(`"*"`);
  if(i>=0) sta.columns[i] = `*`;
  if(sta.columns.length===0 || !sta.columns.includes('*')) {
    for(var i=0, I=sta.columnsUsed.length; i<I; i++)
      if(!sta.columns.includes(sta.columnsUsed[i])) sta.columns.push(sta.columnsUsed[i]);
  }
  if(!sta.columnsUsed.includes(`"name"`) && !sta.columns.includes(`"name"`)) sta.columns.unshift(`"name"`);
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

async function nlp(db, txt) {
  var wrds = new natural.WordTokenizer().tokenize(txt), tkns = [];
  for(var w of wrds)
    tkns.push({type: 'text', value: w});
  console.log('tkns', tkns);
  var stg1 = number(tkns);
  console.log('stg1', stg1);
  var stg2 = unit(stg1);
  console.log('stg2', stg2);
  var stg3 = reserved(stg2);
  console.log('stg3', stg3);
  var stg4 = await entity(db, stg3);
  return process(stg4);
};
module.exports = nlp;
