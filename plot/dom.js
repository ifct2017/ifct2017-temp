const matchMedia = require('match-media-mock').create();
const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

const STYLE = fs.readFileSync(require.resolve('chartist/dist/chartist.min.css'));
const HTML = `<html><head><style>${STYLE}</style></head><body></body></html>`;
const cssSelectorSplitRE = /((?:[^,"']|"[^"]*"|'[^']*')+)/;
const dom = new JSDOM(HTML, {resources: 'usable'});
const forEach = Array.prototype.forEach;
const indexOf = Array.prototype.indexOf;
matchMedia.setConfig({type: 'screen', width: 1200});

window = dom.window;
document = window.document;
Node = window.Node;
Element = window.Element;
CSSStyleDeclaration = window.CSSStyleDeclaration;
window.matchMedia = matchMedia;

function matches(sel) {
  var matches = (this.document || this.ownerDocument).querySelectorAll(sel), i = matches.length;
  while (--i >= 0 && matches.item(i) !== this) {}
  return i > -1;            
};

function matchesDontThrow(el, sel) {
  try { return matches.call(el, sel); }
  catch (e) { return false; }
}

function setPropertiesFromRule(node, rule, cs) {
  if (!rule.selectorText) return;
  var matched = false, selectors = rule.selectorText.split(cssSelectorSplitRE);
  selectors.forEach((selectorText) => {
    if (selectorText !== "" && selectorText !== "," && !matched && matchesDontThrow(node, selectorText)) {
      var matched = true, rs = rule.style;
      forEach.call(rs, (pro) => cs.setProperty(pro, rs.getPropertyValue(pro), rs.getPropertyPriority(pro)));
    }
  });
}

function getComputedStyle(node) {
  var s = node.style;
  var cs = new CSSStyleDeclaration();
  forEach.call(node.ownerDocument.styleSheets, (sheet) => {
    forEach.call(sheet.cssRules, (rule) => {
      if(!rule.media) setPropertiesFromRule(node, rule, cs);
      else if(indexOf.call(rule.media, "screen")!==-1) forEach.call(rule.cssRules, (rule) => setPropertiesFromRule(node, rule, cs));
    });
  });
  forEach.call(s, (pro) => cs.setProperty(pro, s.getPropertyValue(pro), s.getPropertyPriority(pro)));
  return cs;
};

Element.prototype.matches = matches;
window.getComputedStyle = getComputedStyle;

const Chartist = require('chartist');


var show = true;
var data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};
var options = {
  width: 600,
  height: 400,
  seriesBarDistance: 30
};
line = new Chartist.Bar('body', data, options);
line.on('created', (data) => {
  var div = document.querySelector('body');
  for(var ctGrid of [document.querySelector('.ct-grid')]) {
    console.log(ctGrid.outerHTML);
    console.log(window.getComputedStyle(ctGrid));
  }
});
