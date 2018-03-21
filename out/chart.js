require('./window');
const Chartist = require('chartist');

const FUNCTION = new Map([
  ['bar', Chartist.Bar],
  ['line', Chartist.Line],
  ['pie', Chartist.Pie],
]);
var chartNum = 0;

function tag(nam, cnt='', att={}) {
  var z = document.createElement(nam);
  for(var k in att)
    z.setAttribute(k, att[k]);
  z.textContent = cnt;
  return z;
};

function ccaption(txt, x=0, y=0, o={}) {
  o.x += x; o.y += y;
  return tag('text', txt, o);
};

function defaults(w=0, h=0, o={}) {
  var ccaption = Object.assign({x: 0, y: 0, height: 0.08*h, 'font-size': `${0.03*h}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle', role: 'caption'}, o.ccaption);
  return Object.assign({}, o, {ccaption});
};

function chart(typ, dat, opt) {
  chartNum = (chartNum+1)%65536;
  var w = opt.width, h = opt.height;
  var opt = defaults(w, h, opt), ch = opt.ccaption.height;
  var div = document.createElement('div');
  document.querySelector('svg').appendChild(div);
  div.id = 'c'+chartNum;
  var cht = new (FUNCTION.get(typ))(div, dat, opt);
  return new Promise((fres) => {
    cht.on('created', (data) => {
      if(opt.caption) {
        var svg = div.querySelector('svg');
        var cap = ccaption(opt.caption, 0.5*w, ch, opt.ccaption);
        for(var e of div.querySelectorAll('svg > g'))
          e.setAttribute('transform', `translate(0, ${ch})`);
        svg.setAttribute('height', h+ch);
        svg.setAttribute('style', '');
        svg.appendChild(cap);
      }
      window.setComputedStyle(div);
      var txt = div.innerHTML;
      div.parentNode.removeChild(div);
      fres(txt);
    });
  });
};
module.exports = chart;
