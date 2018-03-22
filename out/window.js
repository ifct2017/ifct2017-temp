const stylis = require('stylis');
const fs = require('fs');
window = require('svgdom');

const CUSTOM = '.ct-label.ct-vertical { font-family: Courier; font-weight: bold; font-size: 14px; text-anchor: end; }'+
  '.ct-label.ct-horizontal { font-family: Courier; font-weight: bold; font-size: 14px; fill: crimson; text-anchor: start; }';
const CSSPATH = require.resolve('chartist/dist/chartist.min.css');
const STYLE = CUSTOM+fs.readFileSync(CSSPATH, 'utf8');
const SELECTOR = [], CONTENT = [];

function setComputedStyle(elm) {
  for(var i=0, I=SELECTOR.length; i<I; i++) {
    for(var e of elm.querySelectorAll(SELECTOR[i]))
      e.setAttribute('style', CONTENT[i]+e.getAttribute('style'));
  }
};

stylis.use((ctx, cnt, sel, par, lin, col, len) => {
  var s = sel.join(', '), c = cnt.endsWith(';')? cnt:cnt+';';
  if(s.length===0 || s.search(/\:after|\:before/g)>=0 || c.search(/flex|webkit|moz/g)>=0) return;
  c = c.replace(/([\d\.]+)r?em/g, (mth, p1) => 16*parseFloat(p1)+'px');
  SELECTOR.push(s);
  CONTENT.push(c);
});

stylis('', STYLE);
document = window.document;
Element = Node = window.Node;
window.matchMedia = () => console.log('watchMedia: NOT IMPLEMENTED!');
document.implementation = {hasFeature: () => false};
window.setComputedStyle = setComputedStyle;
module.exports = window;
