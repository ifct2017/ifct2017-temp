const descriptions = require('@ifct2017/descriptions');
const compositions = require('@ifct2017/compositions');
const groups = require('@ifct2017/groups');
const csv = require('csv');
const fs = require('fs');

const TSVECTOR = `setweight(to_tsvector('english', "code"), 'A')||`+
  `setweight(to_tsvector('english', "name"), 'B')||`+
  `setweight(to_tsvector('english', "scie"), 'B')||`+
  `setweight(to_tsvector('english', compositions_lang_tags("lang")), 'B')||`+
  `setweight(to_tsvector('english', "grup"), 'C')`;

function createTable(db, row) {
  var don = ['code', 'name', 'scie', 'regn'];
  var z = `CREATE TABLE IF NOT EXISTS "compositions" (`+
    ` "code" TEXT NOT NULL,`+
    ` "name" TEXT NOT NULL,`+
    ` "scie" TEXT NOT NULL,`+
    ` "lang" TEXT NOT NULL,`+
    ` "grup" TEXT NOT NULL,`+
    ` "regn" INT NOT NULL,`;
  for(var k in row) {
    if(don.includes(k)) continue;
    z += ` "${k}" REAL NOT NULL,`;
  }
  z += ` PRIMARY KEY ("code")`+
    `);\n`+
    `CREATE OR REPLACE FUNCTION "compositions_lang_tags" (TEXT) RETURNS TEXT AS $$`+
    ` SELECT lower(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(`+
    ` regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace($1, `+
    ` '^\\[.*\\]$', '', 'g'),`+
    ` 'ḷ', 'l', 'g'),`+
    ` 'ḍ', 'd', 'g'),`+
    ` 'ṇ', 'n', 'g'),`+
    ` 'ṃ', 'm', 'g'),`+
    ` 'ṅ', 'n', 'g'),`+
    ` 'ā', 'a', 'g'),`+
    ` 'ī', 'i', 'g'),`+
    ` '\\w+\\.\\s([\\w\\'',\\/\\(\\)\\- ]+)[;\\.]?', '\\1', 'g'),`+
    ` '[,\\/\\(\\)\\- ]+', ' ', 'g')) $$`+
    ` LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;\n`+
    `CREATE OR REPLACE VIEW "compositions_tsvector" AS `+
    ` SELECT *, ${TSVECTOR} AS "tsvector" FROM "compositions";`;
  return db.query(z);
};

function createIndex(db, row) {
  var don = ['code', 'name', 'scie', 'regn'], z = '';
  z += `CREATE INDEX IF NOT EXISTS "compositions_tsvector_idx" ON "compositions" USING GIN ((${TSVECTOR}));`;
  z += `CREATE INDEX IF NOT EXISTS "compositions_name_idx" ON "compositions" ("name");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositions_scie_idx" ON "compositions" ("scie");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositions_lang_idx" ON "compositions" ("lang");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositions_grup_idx" ON "compositions" ("grup");\n`;
  z += `CREATE INDEX IF NOT EXISTS "compositions_regn_idx" ON "compositions" ("regn");\n`;
  for(var k in row) {
    if(don.includes(k)) continue;
    z += `CREATE INDEX IF NOT EXISTS "compositions_${k}_idx" ON "compositions" ("${k}");\n`;
  }
  return db.query(z);
};

function insert(db, grps, dscs, cmps) {
  var z = `INSERT INTO "compositions" (`;
  for(var k in cmps[0])
    z += `"${k}",`;
  z += `"lang", "grup") VALUES\n`;
  for(var cmp of cmps) {
    z += `(`;
    for(var k in cmp)
      z += `'${cmp[k]}',`;
    var lang = dscs.has(cmp.code)? dscs.get(cmp.code).desc:'';
    var grup = grps.get(cmp.code[0]).grup;
    z += `'${lang}', '${grup}'),\n`;
  }
  z = z.substring(0, z.length-2)+`\n`;
  z += `ON CONFLICT ("code") DO NOTHING;`;
  return db.query(z);
};

function data(db) {
  return new Promise((fres) => {
    var dscs = new Map(), grps = new Map(), cmps = [], p = 0;
    function onEnd() {
      if(++p<3) return;
      createTable(db, cmps[0]).then(
        () => insert(db, grps, dscs, cmps)).then(
        () => createIndex(db, cmps[0])).then(fres);
    };
    var sgrp = fs.createReadStream(groups()).pipe(csv.parse({columns: true, comment: '#'}));
    var sdsc = fs.createReadStream(descriptions()).pipe(csv.parse({columns: true, comment: '#'}));
    var scmp = fs.createReadStream(compositions()).pipe(csv.parse({columns: true, comment: '#'}));
    sgrp.on('data', (ans) => grps.set(ans.code, ans));
    sdsc.on('data', (ans) => dscs.set(ans.code, ans));
    scmp.on('data', (ans) => cmps.push(ans));
    sgrp.on('end', onEnd);
    sdsc.on('end', onEnd);
    scmp.on('end', onEnd);
  });
};
module.exports = data;
