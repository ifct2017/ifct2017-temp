const Parser = require('flora-sql-parser').Parser;
const astToSQL = require('flora-sql-parser').util.astToSQL;
const data = require('../data');

const SELECT = 'select';
const FROMT = [{table: 't', as: null}];

function number(value) {
  return {type: 'number', value};
};

function column(column) {
  return {type: 'column_ref', table: null, column};
};

function table(table, as=null) {
  return {db: null, table, as};
};

function uncomment(txt) {
  txt = txt.replace(/\/\*.*?\*\//g, '');
  txt = txt.replace(/--.*/gm, '');
  return txt.trim();
};

function columnOne(db, txt) {
  var col = await data.column(db, txt);
  return col!=null? [column(col)]:[];
};

async function columnSum(db, txt) {
  var cols = await data.columns(db, txt);
  if(cols==null) return [number(0)];
  var sql = `SELECT * FROM "table" WHERE (`;
  for(var col of cols)
    sql += `"${col}"+`;
  sql = sql.substring(0, sql.length-1)+')';
  return [new Parser().parse(sql).where];
};

async function columnAvg(db, txt) {
  var cols = await data.columns(db, txt);
  if(cols==null) return [number(0)];
  var sql = `SELECT * FROM "table" WHERE ((`;
  for(var col of cols)
    sql += `"${col}"+`;
  sql = sql.substring(0, sql.length-1);
  sql += `)/${cols.length})`;
  return [new Parser().parse(sql).where];
};

async function columnAll(db, txt) {
  var cols = await data.columns(db, txt)||[];
  return cols.map((col) => column(col));
};

function columnAny(db, txt) {
  if(txt.startsWith('all:')) return columnAll(db, txt.substring(4));
  if(txt.startsWith('avg:')) return columnAvg(db, txt.substring(4));
  if(txt.startsWith('sum:')) return columnSum(db, txt.substring(4));
  return columnOne(db, txt);
};

function expressionRename(db, ast, k) {
  if(typeof ast[k]!=='object') return Promise.resolve();
  if(typeof ast[k].type==='column_ref') return columnAny(db, ast[k].column).then((ans) => ast[k]=ans[0]);
  return Promise.all(Object.keys(ast[k]).map((l) => expressionRename(db, ast[k], l)));
};

function expressions(db, ast) {
  if(typeof ast!=='object') return null;
  if(ast.type==='column_ref') return [columnAny()];

};

function asExpression(expr) {
  var sql = astToSQL({type: SELECT, from: FROMT, columns: [{expr, as: null}]});
  return sql.substring(7, sql.length-9).replace(/([\'\"])/g, '$1$1');
};

function asColumn(col, len, as) {
  var txt = len>1 && as!=null? as+': '+col:as;
  return txt!=null && col.endsWith('_e')? txt+' error':txt;
};

async function columns(db, ast) {
  var y = await Promise.all(ast.map((col) => expressions(db, col.expr)));
  for(var i=0, I=ast.length, z=[]; i<I; i++) {
    var col = ast[i], exps = y[i];
    for(var exp of exps) {
      if(exp.type!=='column_ref') z.push({expr: exp, as: as==null? asExpression(exp):as});
      else z.push({expr: exp, as: asColumn(exp.column, exps.length, col.as)});
      if(exp.type!=='column_ref' || !data.VALUECOLUMNS.has(exp.column)) continue;
      z.push({expr: column(exp.column+'_e'), as: asColumn(exp.column+'_e', exps.length, col.as)});
    }
  }
  return z;
};

async function orderBy(db, ast) {
  var y = await Promise.all(ast.map((col) => expressions(db, col.expr)));
  for(var i=0, I=ast.length, z=[]; i<I; i++) {
    var col = ast[i], exps = y[i];
    for(var exp of exps)
      z.push({expr: exp, type: col.type});
  }
  return z;
};

function groupBy(db, ast) {
  return Promise.all(ast.map((exp) => expressions(db, exp)));
};

function from(db, ast) {
  var sql = `SELECT * FROM "table" WHERE TRUE AND TRUE`;
  var asu = new Parser().parse(sql);
  if(!ast.where) ast.where = asu.where;
  else { asu.where.left = ast.where; ast.where = asu.where; ast.where.left.parentheses = true; }
  for(var i=0, I=ast.from.length; i<I; i++) {
    ast.from[i].db = null;
    var tab = ast.from[i].table.trim();
    if(data.tableMatch(tab.split(' '))!=null) continue;
    sql = `SELECT * FROM "table" WHERE FALSE OR ("tsvector" != plainto_tsquery('${tab}'))`;
    var asu = new Parser().parse(sql);
    asu.where.right.operator = '@@';
    if(ast.where.right.value===true) { ast.where.right = asu.where; ast.where.right.parentheses = true; }
    else { asu.where.left = ast.where.right; ast.where.right = asu.where; }
  }
  ast.from = [table('compositions_tsvector')];
};

function process(db, ast) {
  var rdy = [];
  if(typeof ast.columns!=='string') rdy.push(columns(db, ast.columns).then((ans) => ast.columns = ans));
  if(ast.where!=null) rdy.push(expressionRename(db, ast, 'where'));
  if(ast.having!=null) rdy.push(expressionRename(db, ast, 'having'));
  if(ast.orderby!=null) rdy.push(orderBy(db, ast.orderby).then((ans) => ast.orderby = ans));
  if(ast.groupby!=null) rdy.push(groupBy(db, ast.groupby).then((ans) => ast.groupby = ans));
  return Promise.all(rdy).then(() => from(db, ast));
};

function limit(ast, max) {
  const value = Math.max(ast.limit? ast.limit[1].value:max, max);
  ast.limit = [{type: 'number', value}];
};

function aql(db, txt, lim=20) {
  txt = uncomment(txt);
  txt = txt.endsWith(';')? txt.slice(0, -1):txt;
  if(txt.includes(';')) throw new Error('Too many queries');
  const ast = new Parser().parse(txt);
  if(ast.type!=='select') throw new Error('Only SELECT query supported');
  return process(db, ast).then(() => {
    limit(ast, lim);
    return astToSQL(ast);
  });
};
module.exports = aql;
