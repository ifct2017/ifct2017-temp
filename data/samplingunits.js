const samplingunits = require('@ifct2017/samplingunits');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "state"), 'A')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "samplingunits" (`+
    ` "sno" TEXT NOT NULL,`+
    ` "state" TEXT NOT NULL,`+
    ` "districts" INT NOT NULL,`+
    ` "Selected" INT NOT NULL,`+
    ` PRIMARY KEY ("sno")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "samplingunits_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "samplingunits";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "samplingunits_state_idx" ON "samplingunits" ("state");\n`;
  z += `CREATE INDEX IF NOT EXISTS "samplingunits_districts_idx" ON "samplingunits" ("distrcits");\n`;
  z += `CREATE INDEX IF NOT EXISTS "samplingunits_selected_idx" ON "samplingunits" ("selected");\n`;
  z += `CREATE INDEX IF NOT EXISTS "samplingunits_tsvector_idx" ON "samplingunits" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, suns) {
  var z = `INSERT INTO "samplingunits" ("sno", "state", "districts", "selected") VALUES\n`;
  for(var s of suns)
    z += `('${s.sno}', '${s.state}', '${s.districts}', '${s.selected}'),\n`;
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("sno") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var suns = [];
    var ssun = fs.createReadStream(samplingunits()).pipe(csv.parse({columns: true, comment: '#'}));
    ssun.on('data', (val) => suns.push(val));
    ssun.on('end', () => {
      createTable(db).then(
        () => insert(db, suns)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
module.exports = data;
