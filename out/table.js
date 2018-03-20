function attr(val) {
  var z = '';
  for(var k in val)
    z += ` ${k}="${val[k]}"`;
  return z;
};

function etag(nam, ext='', att={}) {
  return `<${nam}${ext}${attr(att)}/>`;
};

function tag(nam, cnt='', ext='', att={}) {
  return `<${nam}${ext}${attr(att)}>${cnt}</${nam}>`;
};

function tstrip(num, x=0, y=0, dy=0, to={}) {
  var a = Object.assign({}, to, {x: x+(to.x||0), y: y+(to.y||0)});
  for(var i=0, z=''; i<num; i++, a.y+=dy)
    z += etag('rect', '', a);
  return z;
};

function thead(val, x=0, y=0, dx=0, to={}, tho={}) {
  var a = Object.assign({}, to, {y: y+(to.y||0)});
  var ah = Object.assign({}, tho, {x: x+dx+(tho.x||0)});
  for(var i=0, I=val.length, th=''; i<I; i++, ah.x+=dx)
    th += tag('tspan', val[i], ' role="columnheader"', ah);
  return tag('text', th, ' role="row"', a);
};

function tbody(nam, val, x=0, y=0, dx=0, to={}, tho={}, tro={}) {
  var a = Object.assign({}, to, {y: y+(to.y||0)});
  var ah = Object.assign({}, tho, {x: x+(tho.x||0)});
  var ar = Object.assign({}, tro, {x: x+dx+(tro.x||0)});
  var th = tag('tspan', nam, ' role="rowheader"', ah);
  for(var i=0, I=val.length, tr=''; i<I; i++, ar.x+=dx)
    tr += tag('tspan', val[i], ' role="cell"', ar);
  return tag('text', th+tr, ' role="row"', a);
};

function defaults(nc, nr, x, y, dx, dy, opt) {
  var fsz = 0.6*Math.min(dx, dy);
  var nam = new Array(Math.max(nc, nr)).fill('');
  var def = {title: '', head: nam, body: nam};
  var so = Object.assign({}, opt.so||{});
  var to = Object.assign({transform: 'translate(0, 0)'}, opt.to||{});
  var tstrip = opt.tstrip||{}, thead = opt.thead||{}, tbody = opt.tbody||{};
  tstrip.to = Object.assign({fill: 'gainsboro'}, tstrip.to||{});
  thead.to = Object.assign({'font-size': `${fsz}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, thead.to);
  thead.tho = Object.assign({x: 0.5*dx}, thead.tho||{});
  tbody.to = Object.assign({'font-size': `${fsz}px`, 'text-anchor': 'middle'}, tbody.to||{});
  tbody.tho = Object.assign({'font-weight': 'bold', 'fill': 'crimson', 'text-anchor': 'start'}, tbody.tho||{});
  tbody.tro = Object.assign({x: 0.5*dx}, tbody.tro||{});
  return Object.assign(def, opt, {so, to, tstrip, thead, tbody});
};

function table(dat, x=0, y=0, dx=0, dy=0, opt={}) {
  var nr = dat.length, nc = nr>0? dat[0].length:0;
  var opt = defaults(nc, nr, x, y, dx, dy, opt);
  var width = (nc+1)*dx, height = (nr+1)*dy;
  opt.so.width = (opt.so.width||width)+2*x;
  opt.so.height = (opt.so.height||height)+2*y;
  opt.so.viewBox = opt.so.viewBox||`0 0 ${opt.so.width} ${opt.so.height}`;
  opt.tstrip.to.width = width+(opt.tstrip.to.width||0);
  opt.tstrip.to.height = dy+(opt.tstrip.to.height||0);
  var gv = tstrip(Math.floor(nr/2), x, y+dy, dy*2, opt.tstrip.to);
  gv += thead(opt.head, x, y, dx, opt.thead.to, opt.thead.tho);
  for(var i=0, y=y+dy; i<nr; i++, y+=dy)
    gv += tbody(opt.body[i], dat[i], x, y, dx, opt.tbody.to, opt.tbody.tho, opt.tbody.tro);
  gv = tag('g', gv, ' role="table"', opt.to);
  gv = tag('title', opt.title)+gv;
  return tag('svg', gv, ' xmlns="http://www.w3.org/2000/svg"', opt.so);
};
module.exports = table;


var data = [
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
];
var opt = {
  title: 'Hello',
  head: ['one', 'two', 'three', 'four', 'five', 'six'],
  body: ['row1', 'row2', 'row2', 'row2', 'row2'],
  tstrip: {to: {x: -4, y: 4, width: 8}},
  thead: {to: {'font-family': 'Verdana'}}
};
var svg = table(data, 25, 20, 100, 20, opt);
var image = require('./image');
image(svg, 0, 0, 'svg', 'png').then(console.log);
