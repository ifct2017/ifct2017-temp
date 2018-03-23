const abbreviations = require('./abbreviations');
const columns = require('./columns');
const compositions = require('./compositions');
const frequencydistribution = require('./frequencydistribution');
const groups = require('./groups');
const methods = require('./methods');
const regions = require('./regions');
const samplingunits = require('./samplingunits');

function data(db) {
  return Promise.all([abbreviations(db), columns(db), compositions(db), frequencydistribution(db), groups(db),
    methods(db), regions(db), samplingunits(db)]);
};
data.abbreviations = abbreviations;
data.columns = columns;
data.compositions = compositions;
data.frequencydistribution = frequencydistribution;
data.groups = groups;
data.methods = methods;
data.regions = regions;
data.samplingunits = samplingunits;
module.exports = data;
