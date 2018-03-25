const csv = require('csv');
const fs = require('fs');

function tsvector(fld) {
  var z = '';
  for(var k in fld)
    if(fld[k]!=null) z += `setweight(to_tsvector('english', "${k}"), '${fld[k]}')||`;
  return z.substring(0, z.length-2);
};

function read(pth, z=[]) {
  var srm = fs.createReadStream(pth).pipe(csv.parse({columns: true, comment: '#'}));
  return new Promise((fres) => {
    srm.on('data', (v) => z.push(v));
    srm.on('end', () => fres(z));
  });
};

function exists(db, tab) {
  var z = `SELECT 1 FROM information_schema.tables WHERE table_name='${tab}';`;
  return db.query(z).then((ans) => ans.rowCount>0);
};

function create(db, tab, fld, pk, tv=null) {
  var z = `CREATE TABLE IF NOT EXISTS "${tab}" (`;
  for(var k in fld)
    if(fld[k]!=null) z += `"${k}" ${fld[k]}, `;
  z += `PRIMARY KEY("${pk}"));\n`;
  if(tv!=null) z += `CREATE OR REPLACE VIEW "${tab}_tsvector" AS SELECT *, ${tv} AS "tsvector" FROM "${tab}";\n`;
  return db.query(z);
};

function index(db, tab, fld, pk, tv=null) {
  var z = tv!=null? `CREATE INDEX IF NOT EXISTS "${tab}_tsvector_idx" ON "${tab}" USING GIN ((${tv}));\n`:'';
  for(var k in fld)
    if(fld[k]!=null && fld[k]!=pk) z += `CREATE INDEX IF NOT EXISTS "${tab}_${k}_idx" ON "${tab}" ("${k}");\n`;
  return db.query(z);
};

function insert(db, tab, pk, val) {
  var z = `INSERT INTO "${tab}" (`;
  for(var k in val[0])
    z += `"${k}", `;
  z = z.substring(0, z.length-2)+') VALUES\n(';
  for(var i=0, I=val.length; i<I; i++) {
    for(var k in val[i])
      z += `'${val[i][k]}', `;
    z = z.substring(0, z.length-2)+'),\n(';
  }
  z = z.substring(0, z.length-3)+'\n';
  z += `ON CONFLICT ("${pk}") DO NOTHING;`;
  return db.query(z);
};

function setup(db, pth, tab, fld, pk, tfld=null) {
  return read(pth).then((val) => {
    var tv = tfld!=null? tsvector(tfld):null;
    return create(db, tab, fld, pk, tv).then(() => insert(db, tab, pk, val)).then(() => index(db, tab, fld, pk, tv));
  });
};  
module.exports = {tsvector, read, exists, create, index, insert, setup};
