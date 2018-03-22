const Parser = require('flora-sql-parser').Parser;
const astToSQL = require('flora-sql-parser').util.astToSQL;

function number(val) {
  return {type: 'number', value: val};
};

function column(col) {
  return {type: 'column_ref', table: null, column: col};
};

function table(tab, as=null) {
  return {db: null, table: tab, as};
};

function uncomment(txt) {
  txt = txt.replace(/\/\*.*?\*\//g, '');
  txt = txt.replace(/--.*/gm, '');
  return txt.trim();
};

function codeOne(db, txt) {
  if(txt.trim()==='*') return Promise.resolve('*');
  var sql = `SELECT "code" FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)`+
    ` ORDER BY ts_rank("tsvector", plainto_tsquery($1), 16) DESC LIMIT 1`;
  return db.query(sql, [txt]).then((ans) => ans.rowCount>0? ans.rows[0].code:null);
};

function codeAll(db, txt) {
  if(txt.trim()==='*') return Promise.resolve('*');
  var sql = `SELECT "code" FROM "columns_tsvector" WHERE "tsvector" @@ plainto_tsquery($1)`;
  return db.query(sql, [txt]).then((ans) => {
    for(var i=0, I=ans.rowCount, z=[]; i<I; i++)
      z[i] = ans.rows[i].code;
    return z;
  });
};

function expOne(db, txt, as=null, type=null) {
  return codeOne(db, txt).then((ans) => {
    return [{expr: column(ans), as, type}];
  });
};

function expSum(db, txt, as=null, type=null) {
  return codeAll(db, txt).then((ans) => {
    if(ans.length===0) return [{expr: number(0), as, type}]
    var sql = `SELECT * FROM "table" WHERE (`;
    for(var col of ans)
      sql += `"${col}"+`;
    sql = sql.substring(0, sql.length-1)+')';
    var ast = new Parser().parse(sql);
    return [{expr: ast.where, as, type}];
  });
};

function expAvg(db, txt, as=null, type=null) {
  return codeAll(db, txt).then((ans) => {
    if(ans.length===0) return [{expr: number(0), as, type}]
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
  return codeAll(db, txt).then((ans) => {
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

function limit(ast, val) {
  const lim = ast.limit? ast.limit[1].value : val;
  ast.limit = [{'type': 'number', 'value': (lim>val? val:lim)}];
};

function update(db, txt, lim) {
  txt = uncomment(txt);
  txt = txt.endsWith(';')? txt.slice(0, -1) : txt;
  if(txt.includes(';')) throw new Error('Too many queries');
  const p = new Parser(), ast = p.parse(txt);
  if(ast.type!=='select') throw new Error('Only SELECT query supported');
  return rename(db, ast).then(() => {
    limit(ast, lim);
    return astToSQL(ast);
  });
};

function aql(db, txt) {
  return update(db, txt, 20);
};
module.exports = aql;
