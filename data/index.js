const abbreviations = require('./abbreviations');
const columns = require('./columns');
const compositions = require('./compositions');
const groups = require('./groups');

function data(db) {
  return Promise.all([abbreviations(db), columns(db), compositions(db), groups(db)]);
};
data.abbreviations = abbreviations;
data.columns = columns;
data.compositions = compositions;
data.groups = groups;
module.exports = data;
