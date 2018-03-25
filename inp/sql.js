const columns = require('../data').columns;

const UNIT = new Map([[0, 'g'], [3, 'mg'], [6, 'μg'], [9, 'ng']]);

function round(num) {
  return Math.round(num*1e+12)/1e+12;
};

function toColumns(ans) {
  for(var i=0, I=ans.length, z={}; i<I; i++) {
    for(var k in ans[i])
      (z[k]=z[k]||[])[i] = ans[i][k];
  }
  return z;
};

function toGroups(ans) {
  var z = {};
  for(var k in ans) {
    if(k.endsWith('_e')) {
      var k0 = k.substring(0, k.length-2);
      z[k0] = z[k0]||{};
      z[k0].name = columns.get(k0);
      z[k0].error = ans[k];
      continue;
    }
    z[k] = z[k]||{};
    if(!k.includes('"')) z[k].name = columns.get(k);
    else z[k].name = k.replace(/\"(\w+)\"/g, (m, p1) => columns.get(p1));
    z[k].value = ans[k];
  }
  return z;
};

function toUnits(ans) {
  for(var k in ans) {
    if(!Array.isArray(ans[k].value)) continue;
    if(typeof ans[k].value[0]!=='number') continue;
    var max = Math.max.apply(null, ans[k].value);
    var exp = Math.min(-Math.floor(Math.log10(max+1e-10)/3)*3, 9);
    var val = ans[k].value, err = ans[k].error||[], fct = 10**exp;
    for(var i=0, I=val.length; i<I; i++)
      val[i] = round(val[i]*fct);
    for(var i=0, I=err.length; i<I; i++)
      err[i] = round(err[i]*fct);
    ans[k].unit = UNIT.get(exp);
  }
  return ans;
};

function toTexts(ans) {
  for(var k in ans) {
    var val = ans[k].value||[], err = ans[k].error||[], unt=ans[k].unit||'';
    for(var i=0, I=Math.max(val.length, err.length), txt=[]; i<I; i++)
      txt[i] = (val[i]!=null? val[i]:'')+(err[i]? '±'+err[i]:'')+unt;
    ans[k].text = txt;
  }
  return ans;
};

function range(fld) {
  var z = [[], []];
  var val = fld.value||[];
  var err = fld.error||[];
  for(var i=0, I=val.length; i<I; i++) {
    z[0][i] = (val[i]||0)-(err[i]||0);
    z[1][i] = (val[i]||0)+(err[i]||0);
  }
  return z;
};

function sql(db, txt) {
  return db.query(txt).then((ans) => ans.rows||[]);
};
sql.toColumns = toColumns;
sql.toGroups = toGroups;
sql.toUnits = toUnits;
sql.toTexts = toTexts;
sql.range = range;
module.exports = sql;
