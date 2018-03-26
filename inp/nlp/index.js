const natural = require('natural');
const number = require('./number');
const unit = require('./unit');
const reserved = require('./reserved');
const entity = require('./entity');
const T = require('./type');

const NULLORDER = [
  {t: [T.KEYWORD, T.KEYWORD, T.ORDINAL], v: [/SELECT/, /NULL/, /1/], f: (s, t, i) => token(T.KEYWORD, 'NULLS FIRST')},
  {t: [T.KEYWORD, T.KEYWORD, T.TEXT], v: [/SELECT/, /NULL/, /last/], f: (s, t, i) => token(T.KEYWORD, 'NULLS LAST')},
];
const NUMBER = [
  {t: [T.CARDINAL, T.ORDINAL], v: [null, null], f: (s, t, i) => token(T.CARDINAL, t[i].value/t[i+1].value)},
  {t: [T.CARDINAL, T.UNIT], v: [null, null], f: (s, t, i) => token(T.CARDINAL, t[i].value*t[i+1].value)},
];
const LIMIT = [
  {t: [T.KEYWORD, T.NUMBER], v: [/ASC|LIMIT/, null], f: (s, t, i) => { s.limit = t[i+1].value; return null; }},
  {t: [T.NUMBER, T.KEYWORD], v: [null, /ASC|LIMIT/], f: (s, t, i) => { s.limit = t[i].value; return null; }},
  {t: [T.KEYWORD, T.NUMBER], v: [/(DESC )?LIMIT/, null], f: (s, t, i) => { s.limit = t[i+1].value; s.reverse = !s.reverse; return null; }},
  {t: [T.NUMBER, T.KEYWORD], v: [null, /(DESC )?LIMIT/], f: (s, t, i) => { s.limit = t[i].value; s.reverse = !s.reverse; return null; }},
];
const VALUE = [
  {t: [T.OPERATOR, T.KEYWORD, T.COLUMN], v: [/ALL/, /TYPE/, null], f: (s, t, i) => token(T.COLUMN, `all: ${t[i+2].value}`)},
  {t: [T.OPERATOR, T.KEYWORD, T.COLUMN], v: [/\+/, /TYPE/, null], f: (s, t, i) => token(T.COLUMN, `sum: ${t[i+2].value}`)},
  {t: [T.FUNCTION, T.KEYWORD, T.COLUMN], v: [/avg/, /TYPE/, null], f: (s, t, i) => token(T.COLUMN, `avg: ${t[i+2].value}`)},
  {t: [T.COLUMN, T.KEYWORD, T.CARDINAL], v: [null, /PER/, null], f: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token(T.EXPRESSION, `("${t[i].value}"*${t[i+2].value/100})`); }},
  {t: [T.COLUMN, T.KEYWORD, T.UNIT], v: [null, /PER/, null], f: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token(T.EXPRESSION, `("${t[i].value}"*${t[i+2].value/100})`); }},
  {t: [T.COLUMN, T.KEYWORD, T.UNIT], v: [null, /AS|IN/, null], f: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token(T.EXPRESSION, `("${t[i].value}"/${t[i+1].value})`); }},
  {t: [T.COLUMN], v: [null], f: (s, t, i) => { s.columnsUsed.push(`"${t[i].value}"`); return token(T.EXPRESSION, `"${t[i].value}"`); }},
  {t: [T.NUMBER], v: [null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value}`)},
  {t: [T.TEXT], v: [null], f: (s, t, i) => token(T.EXPRESSION, `'${t[i].value}'`)},
  {t: [T.KEYWORD], v: [/NULL|TRUE|FALSE/], f: (s, t, i) => token(T.EXPRESSION, t[i].value)},
];
const EXPRESSION = [
  {t: [T.EXPRESSION, T.BINARY, T.EXPRESSION, T.OPERATOR, T.EXPRESSION], v: [null, null, null, /ESCAPE/, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+1].value} ${t[i+2].value} ESCAPE ${t[i+4].value}`)},
  {t: [T.EXPRESSION, T.TERNARY, T.EXPRESSION, T.OPERATOR, T.EXPRESSION], v: [null, null, null, /AND/, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+1].value} ${t[i+2].value} AND ${t[i+4].value}`)},
  {t: [T.EXPRESSION, T.TERNARY, T.EXPRESSION, T.EXPRESSION], v: [null, null, null, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+1].value} ${t[i+2].value} AND ${t[i+3].value}`)},
  {t: [T.EXPRESSION, T.BINARY, T.EXPRESSION, T.OPERATOR, T.EXPRESSION], v: [null, null, null, /AND/, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+1].value} ${t[i+2].value} AND ${t[i].value} ${t[i+1].value} ${t[i+4].value}`)},
  {t: [T.EXPRESSION, T.OPERATOR, T.EXPRESSION, T.BINARY, T.EXPRESSION], v: [null, /AND/, null, null, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+3].value} ${t[i+4].value} AND ${t[i+2].value} ${t[i+3].value} ${t[i+4].value}`)},
  {t: [T.EXPRESSION, T.BINARY, T.EXPRESSION], v: [null, null, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value} ${t[i+1].value} ${t[i+2].value}`)},
  {t: [T.EXPRESSION, T.UNARY], v: [null, null], f: (s, t, i) => token(T.EXPRESSION, `(${t[i].value} ${t[i+1].value})`)},
  {t: [T.UNARY, T.EXPRESSION], v: [null, null], f: (s, t, i) => token(T.EXPRESSION, `(${t[i].value} ${t[i+1].value})`)},
  {t: [T.EXPRESSION, T.EXPRESSION, T.CLOSE], v: [null, null, null], f: (s, t, i) => [token(T.EXPRESSION, `${t[i].value}, ${t[i+1].value}`), t[i+2]]},
  {t: [T.FUNCTION, T.OPEN, T.EXPRESSION, T.CLOSE], v: [null, null, null, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value}(${t[i+2].value})`)},
  {t: [T.FUNCTION, T.EXPRESSION], v: [null, null], f: (s, t, i) => token(T.EXPRESSION, `${t[i].value}(${t[i+1].value})`)},
  {t: [T.OPEN, T.EXPRESSION, T.CLOSE], v: [null, null, null], f: (s, t, i) => token(T.EXPRESSION, `(${t[i+1].value})`)},
];
const ORDERBY = [
  {t: [T.KEYWORD, T.EXPRESSION], v: [/ORDER BY/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return t[i]; }},
  {t: [T.EXPRESSION, T.KEYWORD, T.KEYWORD], v: [null, /DESC/, /NULLS (FIRST|LAST)/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'} ${t[i+2].value}`); return null; }},
  {t: [T.EXPRESSION, T.KEYWORD, T.KEYWORD], v: [null, /ASC/, /NULLS (FIRST|LAST)/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} ${t[i+2].value}`); return null; }},
  {t: [T.KEYWORD, T.EXPRESSION, T.KEYWORD], v: [/DESC/, null, /NULLS (FIRST|LAST)/], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'} ${t[i+2].value}`); return null; }},
  {t: [T.KEYWORD, T.EXPRESSION, T.KEYWORD], v: [/ASC/, null, /NULLS (FIRST|LAST)/], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} ${t[i+2].value}`); return null; }},
  {t: [T.OPERATOR, T.OPERATOR, T.EXPRESSION], v: [/>|>=/, /IN/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {t: [T.OPERATOR, T.OPERATOR, T.EXPRESSION], v: [/<|<=/, /IN/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
  {t: [T.EXPRESSION, T.KEYWORD], v: [null, /NULLS (FIRST|LAST)/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'} ${t[i+1].value}`); return null; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/NULLS (FIRST|LAST)/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'} ${t[i].value}`); return null; }},
  {t: [T.EXPRESSION, T.KEYWORD], v: [null, /DESC/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/DESC/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {t: [T.EXPRESSION, T.KEYWORD], v: [null, /ASC/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/ASC/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
  {t: [T.OPERATOR, T.EXPRESSION], v: [/>|>=/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {t: [T.OPERATOR, T.EXPRESSION], v: [/<|<=/, null], f: (s, t, i) => { s.orderBy.push(`${t[i+1].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
  {t: [T.EXPRESSION, T.OPERATOR], v: [null, />|>=/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'ASC':'DESC'}`); return null; }},
  {t: [T.EXPRESSION, T.OPERATOR], v: [null, /<|<=/], f: (s, t, i) => { s.orderBy.push(`${t[i].value} ${s.reverse? 'DESC':'ASC'}`); return null; }},
];
const GROUPBY = [
  {t: [T.KEYWORD, T.EXPRESSION], v: [/GROUP BY/, null], f: (s, t, i) => { s.groupBy.push(`${t[i+1].value}`); return t[i]; }},
];
const HAVING = [
  {t: [T.OPERATOR, T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/OR|AND/, /NOT/, /HAVING/, null], f: (s, t, i) => { s.having += `${t[i].value} (NOT ${t[i+3].value})`; return null; }},
  {t: [T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/NOT/, /HAVING/, null], f: (s, t, i) => { s.having += `AND (NOT ${t[i+2].value})`; return null; }},
  {t: [T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/OR|AND/, /HAVING/, null], f: (s, t, i) => { s.having += `${t[i].value} (${t[i+2].value})`; return null; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/HAVING/, null], f: (s, t, i) => { s.having += `AND (${t[i+1].value})`; return null; }},
];
const WHERE = [
  {t: [T.OPERATOR, T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/OR|AND/, /NOT/, /WHERE/, null], f: (s, t, i) => { s.where += `${t[i].value} (NOT ${t[i+3].value})`; return null; }},
  {t: [T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/NOT/, /WHERE/, null], f: (s, t, i) => { s.where += `AND (NOT ${t[i+2].value})`; return null; }},
  {t: [T.OPERATOR, T.KEYWORD, T.EXPRESSION], v: [/OR|AND/, /WHERE/, null], f: (s, t, i) => { s.where += `${t[i].value} (${t[i+2].value})`; return null; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/WHERE/, null], f: (s, t, i) => { s.where += `AND (${t[i+1].value})`; return null; }},
];
const FROM = [
  {t: [T.TABLE], v: [null], f: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
  {t: [T.ROW], v: [null], f: (s, t, i) => { s.from.push(`"${t[i].value}"`); return null; }},
];
const COLUMN = [
  {t: [T.KEYWORD, T.KEYWORD, T.EXPRESSION, T.KEYWORD, T.EXPRESSION], v: [/SELECT/, /ALL|DISTINCT/, null, /AS/, null], f: (s, t, i) => { s.columns.push(`${t[i+1].value} ${t[i+2].value} AS ${t[i+4].value}`); return t[i]; }},
  {t: [T.KEYWORD, T.KEYWORD, T.EXPRESSION], v: [/SELECT/, /ALL|DISTINCT/, null], f: (s, t, i) => { s.columns.push(`${t[i+1].value} ${t[i+2].value}`); return t[i]; }},
  {t: [T.KEYWORD, T.EXPRESSION, T.KEYWORD, T.EXPRESSION], v: [/SELECT/, null, /AS/, null], f: (s, t, i) => { s.columns.push(`${t[i+1].value} AS ${t[i+3].value}`); return t[i]; }},
  {t: [T.KEYWORD, T.EXPRESSION], v: [/SELECT/, null], f: (s, t, i) => { s.columns.push(t[i+1].value); return t[i]; }},
];

function token(type, value) {
  return {type, value};
};

function partMatch(tkn, pat, p) {
  if(!tkn.type.startsWith(pat.c[p])) return false;
  return pat.c[p+1]==null || tkn.value.startsWith(pat.c[p+1]);
};

function patternMatch(tkns, t, pat) {
  var P = pat.c.length/2;
  if(t+P>tkns.length) return false;
  for(var p=0; p<P; p++)
    if(!partMatch(tkns[t+p], pat, p)) return false;
  return true;
};

function patternRunOnce(tkns, pat, sta) {
  for(var t=0, T=tkns.length, z=[]; t<T; t++) {
    if(!patternMatch(tkns, t, pat)) { z.push(tkns[t]); continue; }
    console.log(pat);
    var ans = pat.a(sta, tkns, t);
    if(ans==null) continue;
    if(!Array.isArray(ans)) z.push(ans);
    else z.push.apply(Z, ans);
  }
  return z;
};

function patternRun(tkns, pat, sta, rpt=false) {
  do {
    var z = patternRunOnce(tkns, pat, sta);
    if(z.length>=tkns.length) break;
    tkns = z;
  } while(rpt);
  return z;
};

function stageRun(stg, sta, tkns, rpt=false) {
  for(var pat of stg)
    var z = patternRun(tkns, pat, sta, rpt);
  return z;
};

function process(tkns) {
  var sta = {columns: [], from: [], groupBy: [], orderBy: [], where: '', having: '', limit: 0, columnsUsed: [], reverse: false};
  tkns = stageRun(NULLORDER, sta, tkns);
  tkns = stageRun(NUMBER, sta, tkns, true);
  tkns = stageRun(LIMIT, sta, tkns);
  console.log(tkns);
  tkns = stageRun(VALUE, sta, tkns, true);
  tkns = stageRun(EXPRESSION, sta, tkns, true);
  tkns = stageRun(ORDERBY, sta, tkns, true);
  tkns = stageRun(GROUPBY, sta, tkns, true);
  tkns = stageRun(HAVING, sta, tkns);
  tkns = stageRun(WHERE, sta, tkns);
  tkns = stageRun(FROM, sta, tkns);
  tkns = stageRun(COLUMN, sta, tkns, true);
  if(sta.having.startsWith('AND ')) sta.having = sta.having.substring(4);
  if(sta.where.startsWith('AND ')) sta.where = sta.where.substring(4);
  var i = sta.columns.indexOf(`"*"`);
  if(i>=0) sta.columns[i] = `*`;
  if(sta.columns.length===0 || !sta.columns.includes('*')) {
    for(var ord of sta.orderBy) {
      var exp = ord.replace(/ (ASC|DESC)$/, '');
      if(!sta.columns.includes(exp)) sta.columns.push(exp);
    }
  }
  if(sta.columns.length===0 || !sta.columns.includes('*')) {
    for(var col of sta.columnsUsed)
      if(!sta.columns.includes(col)) sta.columns.push(col);
  }
  if(!sta.columnsUsed.includes(`"name"`) && !sta.columns.includes(`"name"`)) sta.columns.unshift(`"name"`);
  if(sta.columns.length===0) sta.columns.push(`*`);
  if(sta.from.length===0) sta.from.push(`"food"`);
  var z = `SELECT ${sta.columns.join(', ')} FROM ${sta.from.join(', ')}`;
  if(sta.where.length>0) z += ` WHERE ${sta.where}`;
  if(sta.orderBy.length>0) z += ` ORDER BY ${sta.orderBy.join(', ')}`;
  if(sta.groupBy.length>0) z += ` GROUP BY ${sta.groupBy.join(', ')}`;
  if(sta.having.length>0) z += ` HAVING ${sta.having}`;
  if(sta.limit>0) z += ` LIMIT ${sta.limit}`;
  return z;
};

function tokenize(txt) {
  var quo = null, wrd = false, y = '', z = [];
  var wrds = new natural.WordPunctTokenizer().tokenize(txt);
  for(var w of wrds) {
    if(w.search(/^\w/)===0) {
      if(quo!=null) y += wrd? ' '+w:w;
      else z.push(token('text', w));
      wrd = true;
    }
    else {
      for(var c of w) {
        if(c==="'" || c==='"' || c==='`') {
          if(quo==null) quo = c;
          else if(quo!==c) y += c;
          else { z.push(token('text', y)); y = ''; qou = null; }
        }
        else if(quo!=null) y += c;
        else if(!/\s/.test(c)) z.push(token('text', c));
      }
      wrd = false;
    }
  }
  return z;
};

async function nlp(db, txt) {
  var tkns = tokenize(txt);
  var stg1 = number(tkns);
  var stg2 = unit(stg1);
  var stg3 = reserved(stg2);
  var stg4 = await entity(db, stg3);
  return process(stg4);
};
module.exports = nlp;
