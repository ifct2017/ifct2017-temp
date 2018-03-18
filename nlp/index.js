const natural = require('natural');
const number = require('./number');
const unit = require('./unit');
const reserved = require('./reserved');
const entity = require('./entity');

function argument(tkn) {
  if(tkn.type==='column') return `"${tkn.value}"`;
  else if(tkn.type==='row') return `'${tkn.value}'`;
  return `${tkn.value}`;
};

function process(tkns) {
  var columns = [], from = [], y = [], z = '';
  for(var i=0, I=tkns.length; i<I; i++)
    if(tkns[i].type!=='text') y.push(tkns[i]);
  tkns = y; y  =[];
  for(var i=0, I=tkns.length-1; i<I; i++) {
    if(tkns[i].type!=='number/cardinal' || tkns[i+1].type!=='unit/mass') y.push(tkns[i]);
    else { y.push({type: 'quantity/mass', value: tkns[i].value*tkns[i+1].value}); i++; }
  }
  tkns = y; y = [];
  for(var i=0, I=tkns.length; i<I; i++){
    if(tkns[i].type==='keyword' && tkns[i].value!=='SELECT' && tkns[i].value!=='FROM') break;
    if(tkns[i].type==='column') columns.push(tkns[i].value);
    else if(tkns[i].type==='row') from.push(tkns[i].value);
  }
  y.push(tkns[i++]);
  for(; i<I; i++){
    if((tkns[i].type==='keyword' && tkns[i].value==='WHERE') || tkns[i].type==='table') continue;
    y.push(tkns[i]);
  }
  console.log('y', y);
  tkns = y; y = [];
  if(columns.length===0) columns.push('*');
  if(from.length===0) from.push('compositions');
  z += `SELECT `;
  for(var col of columns)
    z += col!=='*'? `"${col}", `:`*, `;
  z = z.substring(0, z.length-2);
  z += ` FROM `;
  for(var frm of from)
    z += `"${frm}", `;
  z = z.substring(0, z.length-2);
  for(var i=0, I=tkns.length; i<I; i++) {
    if(tkns[i].type!=='function') {
      var arg = tkns[i].value;
      if(tkns[i].type==='column') arg = `"${arg}"`;
      else if(tkns[i].type==='row') arg = `'${arg}'`;
      z += ` ${arg}`;
      continue;
    }
    var arg = tkns[i+1].value;
    if(tkns[i+1].type==='column') arg = `"${arg}"`;
    else if(tkns[i+1].type==='row') arg = `'${arg}'`;
    z += ` ${tkns[i].value}(${arg})`; i++;
  }
  return z;
};


// forty five hudred twelve
// ninety six million million thousand hundred ten
// thirthy five crore two lakh eithy one thousand
// one crore four fifty three thousand two seven six
// one crore four hundred fifty three thousand two seventy six
// nine four three seven one four five two three six
async function nlp(db) {
  var txt = 'which food has highest protein per gram';
  var wrds = new natural.WordTokenizer().tokenize(txt), tkns = [];
  for(var w of wrds)
    tkns.push({type: 'text', value: w});
  console.log(tkns);
  console.log();
  var stg1 = number(tkns);
  console.log(stg1);
  console.log();
  var stg2 = unit(stg1);
  console.log(stg2);
  console.log();
  var stg3 = reserved(stg2);
  console.log(stg3);
  console.log();
  var stg4 = await entity(db, stg3);
  console.log(stg4);
  console.log();
  var sql = process(stg4);
  console.log(sql);
  return sql;
};
module.exports = nlp;
