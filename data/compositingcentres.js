const compositingcentres = require('@ifct2017/compositingcentres');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "region"), 'A')||`+
  `setweight(to_tsvector('english', "centre"), 'B')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "compositingcentres" (`+
    ` "region" TEXT NOT NULL,`+
    ` "centre" TEXT NOT NULL,`+
    ` "samples" INT NOT NULL,`+
    ` PRIMARY KEY ("region")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "compositingcentres_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "compositingcentres";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "compositingcentres_centre_idx" ON "compositingcentres" ("centre");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositingcentres_samples_idx" ON "compositingcentres" ("samples");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositingcentres_tsvector_idx" ON "compositingcentres" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, ccns) {
  var z = `INSERT INTO "compositingcentres" ("region", "centre", "samples") VALUES\n`;
  for(var c of ccns)
    z += `('${c.region}', '${c.centre}', '${c.samples}'),\n`;
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("region") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var ccns = [];
    var sccn = fs.createReadStream(compositingcentres()).pipe(csv.parse({columns: true, comment: '#'}));
    sccn.on('data', (val) => ccns.push(val));
    sccn.on('end', () => {
      createTable(db).then(
        () => insert(db, ccns)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
module.exports = data;
