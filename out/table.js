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
    th += tag('tspan', val[i], ` role="columnheader"`, ah);
  return tag('text', th, ` role="row"`, a);
};

function tbody(nam, val, x=0, y=0, dx=0, to={}, tho={}, tro={}) {
  var a = Object.assign({}, to, {y: y+(to.y||0)});
  var ah = Object.assign({}, tho, {x: x+(tho.x||0)});
  var ar = Object.assign({}, tho, {x: x+dx+(tro.x||0)});
  var th = tag('tspan', nam, ` role="rowheader"`, );
  for(var i=0, I=val.length, x=x+dx, tr=''; i<I; i++, x+=dx)
    tr += tag('tspan', val[i], ` role="cell" x="${x}"`, tro);
  return tag('text', th+tr, ` role="row" y="${y}"`, to);
};

function defaults(nc, nr, x, y, dx, dy, opt) {
  var nam = new Array(Math.max(nc, nr)).fill('');
  var def = {title: '', head: nam, body: nam, padx: 0.25*dx, pady: dy};
  var so = Object.assign({}, opt.so||{});
  var to = Object.assign({transform: 'translate(0, 0)'}, opt.to||{});
  var tstrip = opt.tstrip||{}, thead = opt.thead||{}, tbody = opt.tbody||{};
  tstrip.to = Object.assign({fill: 'gainsboro'}, tstrip.to||{});
  thead.to = Object.assign({'font-size': `${0.18*dy}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, thead.to);
  thead.tho = Object.assign({}, thead.tho||{});
  tbody.to = Object.assign({'font-size': `${0.18*dy}px`, 'text-anchor': 'middle'}, tbody.to||{});
  tbody.tho = Object.assign({'font-weight': 'bold', 'fill': 'crimson', 'text-anchor': 'start'}, tbody.tho||{});
  tbody.tro = Object.assign({}, tbody.tro||{});
  return Object.assign(def, opt, {so, to, tstrip, thead, tbody});
};

function table(dat, x=0, y=0, dx=0, dy=0, opt={}) {
  var nr = dat.length, nc = nr>0? dat[0].length:0;
  var opt = defaults(nc, nr, x, y, dx, dy, opt);
  var width = nc*dx, height = nr*dy;
  opt.so.width = (opt.so.width||width)+2*opt.padx;
  opt.so.height = (opt.so.height||height)+2*opt.pady;
  opt.so.viewBox = opt.so.viewBox||`${x} ${y} ${opt.so.width} ${opt.so.height}`;
  opt.tstrip.to.width = width+(opt.tstrip.to.width||0);
  opt.tstrip.to.height = height+(opt.tstrip.to.height||0);
  var gv = tstrip(Math.floor(nr/2), x+=opt.padx, (y+=opt.pady)+dy, dy*2, opt.tstrip.to);
  gv += thead(opt.head, x, y, dx, opt.thead.to, opt.thead.tho);
  for(var i=0, y=y+dy; i<nr; i++, y+=dy)
    gv += tbody(opt.body[i], x, y, dx, opt.tbody.to, opt.tbody.tho, opt.tbody.tro);
  gv = tag('g', gv, ` role="table"`, opt.to);
  gv = tag('title', opt.title)+gv;
  return tag('svg', gv, '', opt.so);
};
module.exports = table;
