const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');
const CHARTIST_CSS = fs.readFileSync(__dirname+'/chartist.min.css', 'utf8');
const HTML = `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
  <style>${CHARTIST_CSS}</style>
  <div></div>
  </body>
</html>`;
const dom = new JSDOM(HTML, {resources: 'usable'});
window = dom.window; Node = window.Node; Element = window.Element; CSSStyleDeclaration = window.CSSStyleDeclaration; document = dom.window.document;
matchMedia = require('match-media-mock').create();
matchMedia.setConfig({type: 'screen', width: 1200});
window.matchMedia = () => console.log('who called?');
const Chartist = require('chartist');
var cssSelectorSplitRE = /((?:[^,"']|"[^"]*"|'[^']*')+)/;

function matches(s) {
  var matches = (this.document || this.ownerDocument).querySelectorAll(s), i = matches.length;
  while (--i >= 0 && matches.item(i) !== this) {}
  return i > -1;            
};
function matchesDontThrow(el, selector) {
  try {
    return matches.call(el, selector);
  } catch (e) {
    return false;
  }
}

getComputedStyle = function (node) {
  var s = node.style;
  var cs = new CSSStyleDeclaration();
  var forEach = Array.prototype.forEach;

  function setPropertiesFromRule(rule) {
    if (!rule.selectorText) {
      return;
    }

    var selectors = rule.selectorText.split(cssSelectorSplitRE);
    var matched = false;
    selectors.forEach(function (selectorText) {
      // console.log(node.getAttribute('class'), selectorText, matchesDontThrow(node, selectorText));
      if (selectorText !== "" && selectorText !== "," && !matched && matchesDontThrow(node, selectorText)) {
        matched = true;
        forEach.call(rule.style, function (property) {
          cs.setProperty(property, rule.style.getPropertyValue(property), rule.style.getPropertyPriority(property));
        });
      }
    });
  }

  forEach.call(node.ownerDocument.styleSheets, function (sheet) {
    forEach.call(sheet.cssRules, function (rule) {
      if (rule.media) {
        if (Array.prototype.indexOf.call(rule.media, "screen") !== -1) {
          forEach.call(rule.cssRules, setPropertiesFromRule);
        }
      } else {
        setPropertiesFromRule(rule);
      }
    });
  });

  forEach.call(s, function (property) {
    cs.setProperty(property, s.getPropertyValue(property), s.getPropertyPriority(property));
  });

  return cs;
};



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
line = new Chartist.Bar('div', data, options);
line.on('created', (data) => {
  var div = document.querySelector('div');
  for(var ctGrid of [document.querySelector('.ct-grid')]) {
    //console.log(ctGrid.outerHTML);
    getComputedStyle(ctGrid)
    //console.log(getComputedStyle(ctGrid));
  }
});
