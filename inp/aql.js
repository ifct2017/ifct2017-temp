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

function expOne(db, txt, as=null, type=null) {
  return data.column(db, txt).then((ans) => {
    return [{expr: column(ans), as, type}];
  });
};

function expSum(db, txt, as=null, type=null) {
  return data.columns(db, txt).then((ans) => {
    if(ans==null) return [{expr: number(0), as, type}]
    var sql = `SELECT * FROM "table" WHERE (`;
    for(var col of ans)
      sql += `"${col}"+`;
    sql = sql.substring(0, sql.length-1)+')';
    var ast = new Parser().parse(sql);
    return [{expr: ast.where, as, type}];
  });
};

function expAvg(db, txt, as=null, type=null) {
  return data.columns(db, txt).then((ans) => {
    if(ans==null) return [{expr: number(0), as, type}]
    var sql = `SELECT * FROM "table" WHERE ((`;
    for(var col of ans)
      sql += `"${col}"+`;
    sql = sql.substring(0, sql.length-1);
    sql += `)/${ans.length})`;
    var ast = new Parser().parse(sql);
    return [{expr: ast.where, as, type}];
  });
};

function expAll(db, txt, as=null, type=null) {
  return data.columns(db, txt).then((ans) => {
    var z = [];
    for(var col of ans)
      z.push({expr: column(col), as: as? `${as}_${col}`:null, type});
    return z;
  });
};

function expAny(db, txt, as=null, type=null) {
  if(txt.startsWith('all:')) return expAll(db, txt.substring(4), as, type);
  if(txt.startsWith('avg:')) return expAvg(db, txt.substring(4), as, type);
  if(txt.startsWith('sum:')) return expSum(db, txt.substring(4), as, type);
  return expOne(db, txt, as, type);
};

function expRenameOne(db, ast, k) {
  if(!ast[k].column) return Promise.resolve();
  return expAny(db, ast[k].column).then((ans) => ast[k] = ans[0].expr);
};

function expRename(db, ast, k) {
  var rdy = [];
  if(!ast[k] || typeof ast[k]!=='object') return Promise.resolve();
  if(ast[k].table===undefined) for(var l in ast[k])
    rdy.push(expRename(db, ast[k], l));
  else rdy.push(expRenameOne(db, ast, k));
  return Promise.all(rdy);
};

function lstRenameOne(db, ast, i) {
  if(!ast[i].expr) return expAny(db, ast[i].column).then((ans) => ast.splice(i, 1, ...ans.map((v) => v.expr)))
  if(!ast[i].expr.column) return expRename(db, ast[i], 'expr');
  return expAny(db, ast[i].expr.column, ast[i].as, ast[i].type).then((ans) => ast.splice(i, 1, ...ans));
};

function lstRename(db, ast) {
  var rdy = [];
  for(var i=ast.length-1; i>=0; i--)
    rdy.push(lstRenameOne(db, ast, i));
  return Promise.all(rdy);
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
  var y = await ast.map((col) => expressions(db, col.expr));
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

function frmRename(db, ast) {
  var sql = `SELECT * FROM "table" WHERE TRUE AND TRUE`;
  var asu = new Parser().parse(sql);
  if(!ast.where) ast.where = asu.where;
  else { asu.where.left = ast.where; ast.where = asu.where; ast.where.left.parentheses = true; }
  for(var i=0, I=ast.from.length; i<I; i++) {
    ast.from[i].db = null;
    var tab = ast.from[i].table.trim();
    if(tab.search(/compositions?|foods?/gi)===0) continue;
    sql = `SELECT * FROM "table" WHERE FALSE OR ("tsvector" != plainto_tsquery('${tab}'))`;
    var asu = new Parser().parse(sql);
    asu.where.right.operator = '@@';
    if(ast.where.right.value===true) { ast.where.right = asu.where; ast.where.right.parentheses = true; }
    else { asu.where.left = ast.where.right; ast.where.right = asu.where; }
  }
  ast.from = [table('compositions_tsvector')];
};

function asSet(ast) {
  var type = 'select', from = [{table: 't', as: null}];
  for(var col of ast) {
    if(col.expr.type==='column_ref') continue;
    var sql = astToSQL({type, from, columns: [col]});
    col.as = sql.substring(7, sql.length-9).replace(/([\'\"])/g, '$1$1');
  }
};

function rename(db, ast) {
  var rdy = [];
  if(typeof ast.columns!=='string') rdy.push(lstRename(db, ast.columns));
  if(ast.where) rdy.push(expRename(db, ast, 'where'));
  if(ast.having) rdy.push(expRename(db, ast, 'having'));
  if(ast.orderby) rdy.push(lstRename(db, ast.orderby));
  if(ast.groupby) rdy.push(lstRename(db, ast.groupby));
  return Promise.all(rdy).then(() => frmRename(db, ast)).then(() => asSet(ast.columns));
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
  return rename(db, ast).then(() => {
    limit(ast, lim);
    return astToSQL(ast);
  });
};
module.exports = aql;
