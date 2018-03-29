const abbreviations = require('@ifct2017/abbreviations');
const columns = require('@ifct2017/columns');
const compositingcentres = require('@ifct2017/compositingcentres');
const frequencydistribution = require('@ifct2017/frequencydistribution');
const groups = require('@ifct2017/groups');
const methods = require('@ifct2017/methods');
const regions = require('@ifct2017/regions');
const samplingunits = require('@ifct2017/samplingunits');
const compositions = require('./compositions');
const table = require('./table');

function create(db) {
  console.log(`DATA: starting from scratch`);
  return Promise.all([
    table.setup(db, abbreviations(), 'abbreviations',
      {abbr: 'TEXT NOT NULL', full: 'TEXT NOT NULL'}, 'abbr',
      {abbr: 'A', full: 'B'}
    ),
    table.setup(db, columns(), 'columns',
      {code: 'TEXT NOT NULL', name: 'TEXT NOT NULL', tags: 'TEXT NOT NULL', desc: 'TEXT NOT NULL'}, 'code',
      {code: 'A', name: 'B', tags: 'C'}
    ),
    table.setup(db, compositingcentres(), 'compositingcentres', 
      {region: 'TEXT NOT NULL', centre: 'TEXT NOT NULL', samples: 'INT NOT NULL'}, 'region',
      {region: 'A', centre: 'B'}
    ),
    table.setup(db, frequencydistribution(), 'frequencydistribution',
      {districts: 'TEXT NOT NULL', states: 'INT NOT NULL', selected: 'INT NOT NULL', sampled: 'INT NOT NULL'}, 'districts',
      {districts: 'A'}
    ),
    table.setup(db, groups(), 'groups',
      {code: 'TEXT NOT NULL', grup: 'TEXT NOT NULL', entr: 'INT NOT NULL'}, 'code',
      {code: 'A', grup: 'B'}
    ),
    table.setup(db, methods(), 'methods',
      {analyte: 'TEXT NOT NULL', method: 'TEXT NOT NULL', reference: 'TEXT NOT NULL'}, 'analyte',
      {analyte: 'A', method: 'B', reference: 'C'}
    ),
    table.setup(db, regions(), 'regions',
      {region: 'TEXT NOT NULL', states: 'TEXT NOT NULL'}, 'region',
      {region: 'A', states: 'B'}
    ),
    table.setup(db, samplingunits(), 'samplingunits',
      {sno: 'TEXT NOT NULL', state: 'TEXT NOT NULL', districts: 'INT NOT NULL', selected: 'INT NOT NULL'}, 'sno',
      {sno: 'A', state: 'B'}
    ),
    compositions(db)
  ]);
};

function load(db) {
  console.log(`DATA: becoming a fast reader`);
  return Promise.all([
    db.query('SELECT * FROM "abbreviations";').then((ans) => {
      for(var r of ans.rows||[]) {
        setup.ABBREVIATIONS.set(r.abbr, r.full);
        setup.ABBREVIATIONS.set(r.abbr.replace(/\.\-/g, '').toLowerCase(), r.full);
      }
    }),
    db.query('SELECT * FROM "columns";').then((ans) => {
      for(var r of ans.rows||[])
        setup.COLUMNS.set(r.code, r.name);
    }),
    db.query('SELECT * FROM "groups";').then((ans) => {
      for(var r of ans.rows||[])
        setup.GROUPS.set(r.code, r.grup);
    }),
    db.query('SELECT * FROM "methods";').then((ans) => {
      for(var r of ans.rows||[])
        setup.METHODS.set(r.analyte, r.method+(r.reference? ', ':'')+r.reference);
    }),
    db.query('SELECT * FROM "regions";').then((ans) => {
      for(var r of ans.rows||[])
        setup.REGIONS.set(r.region, r.states);
    })
  ]);
};

function setup(db) {
  return table.exists(db, 'compositions').then((ans) => {
    var rdy = ans? Promise.resolve():create(db);
    return rdy.then(() => load(db));
  });
};
setup.ABBREVIATIONS = new Map();
setup.COLUMNS = new Map();
setup.GROUPS = new Map();
setup.METHODS = new Map();
setup.REGIONS = new Map();
module.exports = setup;
