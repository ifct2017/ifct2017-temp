require('./window');
const Chartist = require('chartist');
const css = require('./css');

// function domComputedStyle(elm) {
//   var sty = window.getComputedStyle(elm).toString();
//   if(sty.length>0) elm.setAttribute('style', sty+(elm.getAttribute('style')||''));
//   for(var i=0, I=elm.children.length; i<I; i++)
//     domComputedStyle(elm.children[i]);
//   return elm;
// };

function svgRemoveClass(elm) {
  var sub = elm.querySelectorAll('[class]');
  for(var i=0, I=sub.length; i<I; i++)
    sub[i].removeAttribute('class');
  return elm;
};

function svgFixXmlns(elm) {
  var sub = elm.querySelectorAll('[xmlns]');
  for(var i=0, I=sub.length; i<I; i++) {
    if(sub[i].getAttribute('xmlns')!=='http://www.w3.org/2000/xmlns/') continue;
    sub[i].setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  }
  return elm;
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
bar = new Chartist.Bar('svg', data, options);
bar.on('created', (data) => {
  var svg = document.querySelector('svg');
  css.setComputedStyle(document);
  svgRemoveClass(svg);
  console.log(svg.outerHTML);
});
