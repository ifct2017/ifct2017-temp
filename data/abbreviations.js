const abbreviations = require('@ifct2017/abbreviations');
const csv = require('csv');
const fs = require('fs');

const NAME = new Map();
const TSVECTOR = `setweight(to_tsvector('english', "abbr"), 'A')||`+
  `setweight(to_tsvector('english', "full"), 'B')||`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "abbreviations" (`+
    ` "code" TEXT NOT NULL,`+
    ` "name" TEXT NOT NULL,`+
    ` "tags" TEXT NOT NULL,`+
    ` PRIMARY KEY ("code")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "columns_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "columns";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "columns_name_idx" ON "columns" ("name");\n`;
  z += `CREATE INDEX IF NOT EXISTS "columns_tsvector_idx" ON "columns" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, cols) {
  var z = `INSERT INTO "columns" ("code", "name", "tags") VALUES\n`;
  for(var col of cols) {
    z += `('${col.code}', '${col.name}', '${col.tags}'),\n`;
    NAME.set(col.code, col.name);
  }
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("code") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var cols = [];
    var scol = fs.createReadStream(abbreviations()).pipe(csv.parse({columns: true, comment: '#'}));
    scol.on('data', (val) => cols.push(val));
    scol.on('end', () => {
      createTable(db).then(
        () => insert(db, cols)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
data.map = NAME;
module.exports = data;
