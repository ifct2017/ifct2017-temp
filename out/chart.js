require('./window');
const Chartist = require('chartist');

const FUNCTION = new Map([
  ['bar', Chartist.Bar],
  ['line', Chartist.Line],
  ['pie', Chartist.Pie],
]);

function tag(nam, cnt='', att={}) {
  var z = document.createElement(nam);
  for(var k in att)
    z.setAttribute(k, att[k]);
  z.textContent = cnt;
  return z;
};

function title(txt, x=0, y=0, o={}) {
  o.x += x; o.y += y;
  return tag('text', txt, o);
};

function defaults(o={}) {
  var chart = Object.assign({width: 1200, height: 600}, o.chart), h = Math.min(chart.width, chart.height);
  var title = Object.assign({x: 0, y: 0, height: 0.08*h, 'font-size': `${0.03*h}px`, 'font-family': 'Verdana', 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle', role: 'caption'}, o.title);
  var subtitle = Object.assign({x: 0, y: 0, height: 0.04*h, 'font-size': `${0.02*h}px`, 'font-family': 'Verdana', 'font-weight': 'bold', fill: 'indianred', 'text-anchor': 'middle'}, o.subtitle);;
  return Object.assign({}, o, {chart, title, subtitle});
};

function chart(dat, typ='line', o={}) {
  var o = defaults(o);
  var w = o.chart.width, h = o.chart.height;
  var th = o.title.height, sth = o.subtitle.height;
  var div = document.createElement('div');
  document.querySelector('svg').appendChild(div);
  var cht = new (FUNCTION.get(typ))(div, dat.value, o.chart);
  return new Promise((fres) => {
    cht.on('created', (data) => {
      var svg = div.querySelector('svg');
      var ttl = title(dat.title, 0.5*w, 0.6*th, o.title);
      var stl = title(dat.subtitle, 0.5*w, th+0.6*sth, o.subtitle);
      for(var e of div.querySelectorAll('svg > g'))
        e.setAttribute('transform', `translate(0, ${th+sth})`);
      svg.setAttribute('height', h+th+sth);
      svg.setAttribute('style', '');
      svg.appendChild(ttl);
      svg.appendChild(stl);
      window.setComputedStyle(div);
      var txt = div.innerHTML;
      div.parentNode.removeChild(div);
      fres(txt);
    });
  });
};
module.exports = chart;
