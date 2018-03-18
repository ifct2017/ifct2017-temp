const natural = require('natural');
const number = require('./number');
const unit = require('./unit');
const reserved = require('./reserved');
const entity = require('./entity');

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
  {c: ['column', null], a: (s, t, i) => token('expression', `"${t[i].value}"`)},
  {c: ['number', null], a: (s, t, i) => token('expression', `${t[i].value}`)},
  {c: ['text', null], a: (s, t, i) => token('expression', `'${t[i].value}'`)},
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


function argument(tkn) {
  if(tkn.type==='column') return `"${tkn.value}"`;
  else if(tkn.type==='row') return `'${tkn.value}'`;
  return `${tkn.value}`;
};

function processValue(tkns) {
  var z = [];
  for(var i=0, I=tkns.length-1; i<I; i++) {
    if(tkns[i].type!=='number/cardinal' || tkns[i+1].type!=='unit/mass') y.push(tkns[i]);
    else { y.push({type: 'quantity/mass', value: tkns[i].value*tkns[i+1].value}); i++; }
  }
  return z;
};

function process(tkns) {
  var columns = [], from = [], y = [], z = '';
  for(var i=0, I=tkns.length; i<I; i++)
    if(tkns[i].type!=='text') y.push(tkns[i]);
  tkns = processValue(tkns);
  for(var i=0, I=tkns.length; i<I; i++){
    if(tkns[i].type==='keyword' && tkns[i].value!=='SELECT' && tkns[i].value!=='FROM') break;
    if(tkns[i].type==='column') columns.push(tkns[i].value);
    else if(tkns[i].type==='row') from.push(tkns[i].value);
  }
  y.push(tkns[i++]);
  for(; i<I; i++){
    if((tkns[i].type==='keyword' && tkns[i].value==='WHERE') || tkns[i].type==='table') continue;
    y.push(tkns[i]);
  }
  console.log('y', y);
  tkns = y; y = [];
  if(columns.length===0) columns.push('*');
  if(from.length===0) from.push('compositions');
  z += `SELECT `;
  for(var col of columns)
    z += col!=='*'? `"${col}", `:`*, `;
  z = z.substring(0, z.length-2);
  z += ` FROM `;
  for(var frm of from)
    z += `"${frm}", `;
  z = z.substring(0, z.length-2);
  for(var i=0, I=tkns.length; i<I; i++) {
    if(tkns[i].type!=='function') {
      var arg = tkns[i].value;
      if(tkns[i].type==='column') arg = `"${arg}"`;
      else if(tkns[i].type==='row') arg = `'${arg}'`;
      z += ` ${arg}`;
      continue;
    }
    var arg = tkns[i+1].value;
    if(tkns[i+1].type==='column') arg = `"${arg}"`;
    else if(tkns[i+1].type==='row') arg = `'${arg}'`;
    z += ` ${tkns[i].value}(${arg})`; i++;
  }
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
