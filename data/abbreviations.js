const abbreviations = require('@ifct2017/abbreviations');
const csv = require('csv');
const fs = require('fs');

const NAME = new Map();
const TSVECTOR = `setweight(to_tsvector('english', "abbr"), 'A')||`+
  `setweight(to_tsvector('english', "full"), 'B')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "abbreviations" (`+
    ` "abbr" TEXT NOT NULL,`+
    ` "full" TEXT NOT NULL,`+
    ` PRIMARY KEY ("abbr")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "abbreviations_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "abbreviations";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "abbreviations_full_idx" ON "abbreviations" ("full");\n`;
  z += `CREATE INDEX IF NOT EXISTS "abbreviations_tsvector_idx" ON "abbreviations" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, abrs) {
  var z = `INSERT INTO "abbreviations" ("abbr", "full") VALUES\n`;
  for(var a of abrs) {
    z += `('${a.abbr}', '${a.full}'),\n`;
    NAME.set(a.abbr.replace('.', '').toLowerCase(), a.full);
    NAME.set(a.abbr, a.full);
  }
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("abbr") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var abrs = [];
    var sabr = fs.createReadStream(abbreviations()).pipe(csv.parse({columns: true, comment: '#'}));
    sabr.on('data', (val) => abrs.push(val));
    sabr.on('end', () => {
      createTable(db).then(
        () => insert(db, abrs)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
data.map = NAME;
module.exports = data;
