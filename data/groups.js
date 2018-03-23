const groups = require('@ifct2017/groups');
const csv = require('csv');
const fs = require('fs');

const NAME = new Map();
const TSVECTOR = `setweight(to_tsvector('english', "code"), 'A')||`+
  `setweight(to_tsvector('english', "grup"), 'B')`;

function createTable(db) {
  var z = `CREATE TABLE IF NOT EXISTS "groups" (`+
    ` "code" TEXT NOT NULL,`+
    ` "grup" TEXT NOT NULL,`+
    ` "entr" INT NOT NULL,`+
    ` PRIMARY KEY ("code")`+
    `);\n`+
    `CREATE OR REPLACE VIEW "groups_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "groups";\n`;
  return db.query(z);
};

function createIndex(db) {
  var z = `CREATE INDEX IF NOT EXISTS "groups_grup_idx" ON "groups" ("grup");\n`;
  z += `CREATE INDEX IF NOT EXISTS "groups_entr_idx" ON "groups" ("entr");\n`;
  z += `CREATE INDEX IF NOT EXISTS "groups_tsvector_idx" ON "groups" USING GIN ((${TSVECTOR}));\n`;
  return db.query(z);
};

function insert(db, grps) {
  var z = `INSERT INTO "groups" ("code", "grup", "entr") VALUES\n`;
  for(var g of grps) {
    z += `('${g.code}', '${g.grup}', '${g.entr}'),\n`;
    NAME.set(g.code, g.grup);
  }
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("code") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var grps = [];
    var sgrp = fs.createReadStream(groups()).pipe(csv.parse({columns: true, comment: '#'}));
    sgrp.on('data', (val) => grps.push(val));
    sgrp.on('end', () => {
      createTable(db).then(
        () => insert(db, grps)).then(
        () => createIndex(db)).then(fres);
    });
  });
};
data.map = NAME;
module.exports = data;
