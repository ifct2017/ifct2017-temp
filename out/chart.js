require('./window');
const Chartist = require('chartist');

const FUNCTION = new Map([
  ['bar', Chartist.Bar],
  ['line', Chartist.Line],
  ['pie', Chartist.Pie],
]);

function strChunk(txt, len=1, sep=' ') {
  return txt;
  for(var i=0, I=txt.length, z=''; i<I; i+=len)
    z += txt.substr(i, len)+sep;
  return z;
};

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
  var chart = Object.assign({width: 600, height: 1200, axisX: {labelInterpolationFnc: (v) => strChunk(v, 10)}}, o.chart), h = Math.min(chart.width, chart.height);
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
      var ttl = title(dat.title, 0.5*h, 0.6*th, o.title);
      var stl = title(dat.subtitle, 0.5*h, th+0.6*sth, o.subtitle);
      for(var e of div.querySelectorAll('svg > g'))
        e.setAttribute('transform', `rotate(90, ${0.5*w}, ${0.5*h}) translate(${-0.5*w+th+sth}, ${-0.5*w-200})`);
      for(var e of div.querySelectorAll('svg text'))
        e.setAttribute('transform', `rotate(-90, ${e.getAttribute('x')}, ${e.getAttribute('y')})`);
      svg.setAttribute('width', h+200);
      svg.setAttribute('height', w+th+sth);
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

var value = {
  labels: ['Jan', 'Febaaaaaaaaaaaaaaa', 'Maraaaaaaaaaaaaaaaaaaaaa', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};
var data = {
  title: "Solar Fields - Savant",
  subtitle: "Mirror's Edge: Catalyst Official Soundtrack",
  value
};
var ans = {"name":["Apple, big","Apple, green","Apple, small","Apple, small, Kashmir","Custard apple"],"fsugar":[9.53,8.39,9.8,9.15,13.35],"lactose":[0,0,0,0,0],"cho":[9.53,8.39,9.8,9.15,13.69],"sucs":[0.14,0.12,0.11,0.37,0],"mals":[0,0,0,0,0],"glus":[1.03,1.08,1.17,1.6,4.25],"frus":[8.36,7.19,8.52,7.18,9.1]};
chart(data).then(console.log)
