const compositions = require('./compositions');
const columns = require('./columns');

function data(db) {
  return compositions(db).then(() => columns(db));
};
data.compositions = compositions;
data.columns = columns;
module.exports = data;
