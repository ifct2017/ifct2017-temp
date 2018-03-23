const regions = require('@ifct2017/regions');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "region"), 'A')||`+
  `setweight(to_tsvector('english', "states"), 'B')`;
 
function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "regions" (`+
    ` "region" TEXT NOT NULL,`+
    ` "states" TEXT NOT NULL,`+
    ` PRIMARY KEY ("region")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "regions_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "regions";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "regions_states_idx" ON "regions" ("states");\n`;
  z += `CREATE INDEX IF NOT EXISTS "regions_tsvector_idx" ON "regions" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, rgns) {
  var z = `INSERT INTO "regions" ("region", "states") VALUES\n`;
  for(var r of rgns)
    z += `('${r.region}', '${r.states}'),\n`;
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("region") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var rgns = [];
    var srgn = fs.createReadStream(regions()).pipe(csv.parse({regions: true, comment: '#'}));
    srgn.on('data', (val) => rgns.push(val));
    srgn.on('end', () => {
      createTable(db).then(
        () => insert(db, rgns)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
module.exports = data;
