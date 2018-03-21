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

function svg(cnt, x=0, y=0, w=0, h=0, o={}) {
  o.width = (o.width||w)+2*x;
  o.height = (o.height||h)+2*y;
  o.viewBox = o.viewBox||`0 0 ${o.width} ${o.height}`;
  return tag('svg', cnt, ' xmlns="http://www.w3.org/2000/svg"', o);
};

function tcaption(txt, x=0, y=0, h=0, o={}) {
  o.x += x; o.y += y;
  return tag('title', txt)+tag('text', txt, ' role="caption"', o);
};

function tstrip(num, x=0, y=0, dy=0, w=0, h=0, o={}) {
  o.x += x; o.y += y; o.width += w; o.height += h;
  for(var i=0, z=''; i<num; i++, o.y+=dy)
    z += etag('rect', '', o);
  return z;
};

function thead(val, x=0, y=0, dx=0, o={}) {
  var a = Object.assign({}, o.root, {y: y+o.root.y});
  var ah = Object.assign({}, o.head, {x: x+dx+o.head.x});
  for(var i=0, I=val.length, th=''; i<I; i++, ah.x+=dx)
    th += tag('tspan', val[i], ' role="columnheader"', ah);
  return tag('text', th, ' role="row"', a);
};

function tbody(nam, val, x=0, y=0, dx=0, o={}) {
  var a = Object.assign({}, o.root, {y: y+o.root.y});
  var ah = Object.assign({}, o.head, {x: x+o.head.x});
  var ar = Object.assign({}, o.row, {x: x+dx+o.row.x});
  var th = tag('tspan', nam, ' role="rowheader"', ah);
  for(var i=0, I=val.length, tr=''; i<I; i++, ar.x+=dx)
    tr += tag('tspan', val[i], ' role="cell"', ar);
  return tag('text', th+tr, ' role="row"', a);
};

function defaults(nc, nr, x=0, y=0, dx=0, dy=0, o={}) {
  var fsz = 0.6*Math.min(dx, dy);
  var nam = new Array(Math.max(nc, nr)).fill('');
  var def = {head: nam, body: nam};
  var svg = Object.assign({}, o.svg);
  var tcaption = Object.assign({x: 0, y: 0, height: 0, 'font-size': `${fsz}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, o.tcaption);
  var table = Object.assign({transform: 'translate(0, 0)'}, o.table);
  var tstrip = Object.assign({x: 0, y: 0, width: 0, height: 0, fill: 'gainsboro'}, o.tstrip);
  var thead = o.thead||{}, tbody = o.tbody||{};
  thead.root = Object.assign({y: 0, 'font-size': `${fsz}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, thead.root);
  thead.head = Object.assign({x: 0.5*dx}, thead.head);
  tbody.root = Object.assign({y:0, 'font-size': `${fsz}px`, 'text-anchor': 'middle'}, tbody.root);
  tbody.head = Object.assign({x:0, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'start'}, tbody.head);
  tbody.row = Object.assign({x: 0.5*dx}, tbody.row);
  return Object.assign(def, o, {svg, tcaption, table, tstrip, thead, tbody});
};

function table(dat, x=0, y=0, dx=0, dy=0, o={}) {
  var nr = dat.length, nc = nr>0? dat[0].length:0;
  var x0 = x, y0 = y, o = defaults(nc, nr, x, y, dx, dy, o);
  var w = (nc+1)*dx, h = (nr+1)*dy, ch = o.caption? dy+o.tcaption.height:0;
  var gv = tstrip(Math.floor(nr/2), x, (y+=ch)+dy, dy*2, w, dy, o.tstrip);
  gv += thead(o.head, x, y, dx, o.thead);
  for(var i=0, y=y+dy; i<nr; i++, y+=dy)
    gv += tbody(o.body[i], dat[i], x, y, dx, o.tbody);
  gv = tag('g', gv, ' role="table"', o.table);
  gv = tcaption(o.caption, x0+0.5*w, y0, h, o.tcaption)+gv;
  return svg(gv, x0, y0, w, h+ch, o.svg);
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
  caption: 'SHIT',
  head: ['one', 'two', 'three', 'four', 'five', 'six'],
  body: ['row1', 'row2', 'row2', 'row2', 'row2'],
  tcaption: {'font-family': 'Verdana'},
  tstrip: {x: -4, y: 14, width: 8},
  thead: {root: {'font-family': 'Verdana'}}
};
var svgs = table(data, 25, 25, 100, 40, opt);
console.log(svgs);
// var image = require('./image');
// image(svgs, 0, 0, 'svg', 'png').then(console.log);
