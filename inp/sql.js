const COLUMNS = require('../data').COLUMNS;

const UNIT = new Map([[0, 'g'], [3, 'mg'], [6, 'μg'], [9, 'ng']]);
const DEFAULTUNIT = new Map([['enerc', 'kcal']]);
const DEFAULTORDER = ['code', 'name', 'scie', 'lang', 'grup', 'regn', 'enerc', 'tsvector'];
const DEFAULTEXCLUDE = ['lang', 'tags', 'tsvector'];

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

function toGroups(ans, exc=DEFAULTEXCLUDE) {
  var z = {};
  for(var k in ans) {
    if(exc.includes(k)) continue;
    if(k.endsWith('_e')) {
      var k0 = k.substring(0, k.length-2);
      z[k0] = z[k0]||{};
      z[k0].name = COLUMNS.get(k0);
      z[k0].error = ans[k];
      continue;
    }
    z[k] = z[k]||{};
    if(!k.includes('"')) z[k].name = COLUMNS.get(k);
    else z[k].name = k.replace(/\"(\w+)\"/g, (m, p1) => COLUMNS.get(p1));
    z[k].value = ans[k];
  }
  return z;
};

function toUnits(ans, def=DEFAULTUNIT) {
  for(var k in ans) {
    if(!Array.isArray(ans[k].value)) continue;
    if(typeof ans[k].value[0]!=='number' || ans[k].error==null) continue;
    if(def.has(k)) { ans[k].unit = def.get(k); continue; }
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

function order(ans, i, def=DEFAULTORDER) {
  return Object.keys(ans).sort((a, b) => {
    var ia = def.indexOf(a)+1, ib = def.indexOf(b)+1;
    if(ia>0 && ib>0) return ia<ib? -1:1;
    if(ia>0 || ib>0) return ia>0? -1:1;
    var va = ans[a].value[i], vb = ans[b].value[i];
    if(ans[a].error==null || ans[a].error==null) return 0;
    return va<vb? 1:(va===vb? 0:-1);
  });
};

function row(ans, i, ord=Object.keys(ans), exc=DEFAULTEXCLUDE) {
  var z = {fld: {name: 'Field', value: []}, val:{name: 'Value', value:[]}};
  for(var k of ord) {
    if(exc.includes(k)) continue;
    z.fld.value.push(ans[k].name);
    z.val.value.push(ans[k].text[0]);
  }
  z.fld.text = z.fld.value;
  z.val.text = z.val.value;
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
sql.order = order;
sql.row = row;
module.exports = sql;
