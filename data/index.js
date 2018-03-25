const abbreviations = require('@ifct2017/abbreviations');
const columns = require('./columns');
const compositingcentres = require('./compositingcentres');
const compositions = require('./compositions');
const frequencydistribution = require('./frequencydistribution');
const groups = require('./groups');
const methods = require('./methods');
const regions = require('./regions');
const samplingunits = require('./samplingunits');
const table = require('./table');


function data(db) {
  return Promise.all([
    table.setup(db, abbreviations(), 'abbreviations', {abbr: 'TEXT NOT NULL', full: 'TEXT NOT NULL'}, 'abbr', {abbr: 'A', full: 'B'}),
    columns(db), compositingcentres(db), compositions(db),
    frequencydistribution(db), groups(db), methods(db), regions(db), samplingunits(db)]);
};
data.abbreviations = abbreviations;
data.columns = columns;
data.compositingcentres = compositingcentres;
data.compositions = compositions;
data.frequencydistribution = frequencydistribution;
data.groups = groups;
data.methods = methods;
data.regions = regions;
data.samplingunits = samplingunits;
module.exports = data;
