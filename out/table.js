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

function title(txt, x=0, y=0, h=0, o={}) {
  o.x += x; o.y += y;
  return tag('title', nam)+tag('text', txt, '', a);
};

function tstrip(num, x=0, y=0, dy=0, w=0, h=0, o={}) {
  o.x += x; o.y += y; o.width += w; o.height += h;
  for(var i=0, z=''; i<num; i++, o.y+=dy)
    z += etag('rect', '', o);
  return z;
};

function thead(val, x=0, y=0, dx=0, to={}, tho={}) {
  var a = Object.assign({}, to, {y: y+to.y});
  var ah = Object.assign({}, tho, {x: x+dx+tho.x});
  for(var i=0, I=val.length, th=''; i<I; i++, ah.x+=dx)
    th += tag('tspan', val[i], ' role="columnheader"', ah);
  return tag('text', th, ' role="row"', a);
};

function tbody(nam, val, x=0, y=0, dx=0, to={}, tho={}, tro={}) {
  var a = Object.assign({}, to, {y: y+to.y});
  var ah = Object.assign({}, tho, {x: x+tho.x});
  var ar = Object.assign({}, tro, {x: x+dx+tro.x});
  var th = tag('tspan', nam, ' role="rowheader"', ah);
  for(var i=0, I=val.length, tr=''; i<I; i++, ar.x+=dx)
    tr += tag('tspan', val[i], ' role="cell"', ar);
  return tag('text', th+tr, ' role="row"', a);
};

function defaults(nc, nr, x, y, dx, dy, opt) {
  var fsz = 0.6*Math.min(dx, dy);
  var nam = new Array(Math.max(nc, nr)).fill('');
  var def = {title: '', head: nam, body: nam};
  var svg = Object.assign({}, opt.svg||{});
  var title = Object.assign({x: 0, y: 0, height: 0}, opt.title||{});
  var table = Object.assign({transform: 'translate(0, 0)'}, opt.table||{});
  var tstrip = Object.assign({x: 0, y: 0, width: 0, height: 0, fill: 'gainsboro'}, opt.tstrip||{});
  var thead = opt.thead||{}, tbody = opt.tbody||{};
  thead.to = Object.assign({y: 0, 'font-size': `${fsz}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, thead.to);
  thead.tho = Object.assign({x: 0.5*dx}, thead.tho||{});
  tbody.to = Object.assign({y:0, 'font-size': `${fsz}px`, 'text-anchor': 'middle'}, tbody.to||{});
  tbody.tho = Object.assign({x:0, 'font-weight': 'bold', 'fill': 'crimson', 'text-anchor': 'start'}, tbody.tho||{});
  tbody.tro = Object.assign({x: 0.5*dx}, tbody.tro||{});
  return Object.assign(def, opt, {svg, title, table, tstrip, thead, tbody});
};

function table(nam, dat, x=0, y=0, dx=0, dy=0, opt={}) {
  var nr = dat.length, nc = nr>0? dat[0].length:0;
  var opt = defaults(nc, nr, x, y, dx, dy, opt);
  var tw = (nc+1)*dx, th = (nr+1)*dy;
  opt.tstrip.width = width+(opt.tstrip.to.width||0);
  opt.tstrip.height = dy+(opt.tstrip.to.height||0);
  var gv = tstrip(Math.floor(nr/2), x, y+dy, dy*2, opt.tstrip.to);
  gv += thead(opt.head, x, y, dx, opt.thead.to, opt.thead.tho);
  for(var i=0, y=y+dy; i<nr; i++, y+=dy)
    gv += tbody(opt.body[i], dat[i], x, y, dx, opt.tbody.to, opt.tbody.tho, opt.tbody.tro);
  gv = tag('g', gv, ' role="table"', opt.to);
  gv = tag('title', nam)+gv;
  return svg(gv, x, y, w, h, opt.svg);
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
var svgs = table(data, 25, 20, 100, 20, opt);
var image = require('./image');
image(svgs, 0, 0, 'svg', 'png').then(console.log);
