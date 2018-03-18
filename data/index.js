const compositions = require('./compositions');
const columns = require('./columns');

function data(db) {
  return Promise.all([compositions(db), columns(db)]);
};
data.compositions = compositions;
data.columns = columns;
module.exports = data;
