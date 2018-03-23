const methods = require('@ifct2017/methods');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "analyte"), 'A')||`+
  `setweight(to_tsvector('english', "method"), 'B')||`+
  `setweight(to_tsvector('english', "reference"), 'C')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "methods" (`+
    ` "analyte" TEXT NOT NULL,`+
    ` "method" TEXT NOT NULL,`+
    ` "reference" TEXT NOT NULL,`+
    ` PRIMARY KEY ("analyte")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "methods_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "methods";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "methods_method_idx" ON "methods" ("method");\n`;
  z += `CREATE INDEX IF NOT EXISTS "methods_reference_idx" ON "methods" ("reference");\n`;
  z += `CREATE INDEX IF NOT EXISTS "methods_tsvector_idx" ON "methods" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, mths) {
  var z = `INSERT INTO "methods" ("analyte", "method", "reference") VALUES\n`;
  for(var m of mths)
    z += `('${m.analyte}', '${m.method}', '${m.reference}'),\n`;
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("analyte") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var mths = [];
    var smth = fs.createReadStream(methods()).pipe(csv.parse({columns: true, comment: '#'}));
    smth.on('data', (val) => mths.push(val));
    smth.on('end', () => {
      createTable(db).then(
        () => insert(db, mths)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
module.exports = data;
