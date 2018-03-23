const compositions = require('./compositions');
const columns = require('./columns');
const groups = require('./groups');

function data(db) {
  return Promise.all([compositions(db), columns(db), groups(db)]);
};
data.compositions = compositions;
data.columns = columns;
data.groups = groups;
module.exports = data;
