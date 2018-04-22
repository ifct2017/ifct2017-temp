const data = require('../data');

function eql(txt) {
  txt = txt.replace(/,?\s*\"\w+?_e\"/g, '').replace(/(SELECT.*?)\*(.*?FROM)/, '$1all$2');
  return txt.replace(/\"(\w+)\"/g, (m, p1) => data.COLUMNS.has(p1)? `"${data.COLUMNS.get(p1)}"`:m);
};
module.exports = eql;
