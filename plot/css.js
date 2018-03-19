const stylis = require('stylis');
const fs = require('fs');

const CSSPATH = require.resolve('chartist/dist/chartist.min.css');
const STYLE = fs.readFileSync(CSSPATH, 'utf8');
const SELECTOR = [], CONTENT = [];

function setComputedStyle(doc) {
  for(var i=0, I=SELECTOR.length; i<I; i++) {
    for(var elm of doc.querySelectorAll(SELECTOR[i])) {
      if(elm.nodeName==='text' && (!CONTENT[i].includes('flex') && !CONTENT[i].includes('webkit'))) continue;
      elm.setAttribute('style', CONTENT[i]+elm.getAttribute('style'));
    }
  }
  return doc;
};

stylis.use((ctx, cnt, sel, par, lin, col, len) => {
  if(sel[0]==='') return;
  var selj = sel.join(', ');
  if(selj.includes(':after')||selj.includes(':before')) return;
  SELECTOR.push(selj);
  CONTENT.push(cnt.endsWith(';')? cnt:cnt+';');
});
stylis('', STYLE);
stylis.setComputedStyle = setComputedStyle;
module.exports = stylis;
