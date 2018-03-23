const frequencydistribution = require('@ifct2017/frequencydistribution');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "districts"), 'A')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "frequencydistribution" (`+
    ` "districts" TEXT NOT NULL,`+
    ` "states" INT NOT NULL,`+
    ` "selected" INT NOT NULL,`+
    ` "sampled" INT NOT NULL,`+
    ` PRIMARY KEY ("districts")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "frequencydistribution_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "frequencydistribution";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "frequencydistribution_states_idx" ON "frequencydistribution" ("states");\n`;
  z += `CREATE INDEX IF NOT EXISTS "frequencydistribution_selected_idx" ON "frequencydistribution" ("selected");\n`;
  z += `CREATE INDEX IF NOT EXISTS "frequencydistribution_sampled_idx" ON "frequencydistribution" ("sampled");\n`;
  z += `CREATE INDEX IF NOT EXISTS "frequencydistribution_tsvector_idx" ON "frequencydistribution" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, fdts) {
  var z = `INSERT INTO "frequencydistribution" ("districts", "states", "selected", "sampled") VALUES\n`;
  for(var f of fdts)
    z += `('${f.districts}', '${f.states}', '${f.selected}', '${f.sampled}'),\n`;
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("districts") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var fdts = [];
    var sfdt = fs.createReadStream(frequencydistribution()).pipe(csv.parse({frequencydistribution: true, comment: '#'}));
    sfdt.on('data', (val) => fdts.push(val));
    sfdt.on('end', () => {
      createTable(db).then(
        () => insert(db, fdts)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
module.exports = data;
