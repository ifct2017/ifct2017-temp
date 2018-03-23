const abbreviations = require('./abbreviations');
const columns = require('./columns');
const compositions = require('./compositions');
const groups = require('./groups');
const methods = require('./methods');

function data(db) {
  return Promise.all([abbreviations(db), columns(db), compositions(db), groups(db), methods(db)]);
};
data.abbreviations = abbreviations;
data.columns = columns;
data.compositions = compositions;
data.groups = groups;
data.methods = methods;
module.exports = data;
