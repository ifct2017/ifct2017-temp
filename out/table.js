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

function svg(cnt, o={}) {
  o.viewBox = o.viewBox||`0 0 ${o.width} ${o.height}`;
  return tag('svg', cnt, ' xmlns="http://www.w3.org/2000/svg"', o);
};

function title(txt, x=0, y=0, o={}) {
  o.x += x; o.y += y;
  return tag('title', txt)+tag('text', txt, ' role="caption"', o);
};

function strip(num, x=0, y=0, dy=0, w=0, h=0, o={}) {
  o.x += x; o.y += y;
  for(var i=0, z=''; i<num; i++, o.y+=dy)
    z += etag('rect', '', o);
  return z;
};

function head(txt, x=0, y=0, o={}) {
  var a = Object.assign({}, o, {x: x+o.x, y: y+o.y});
  return tag('tspan', txt, ' role="columnheader"', a);
};

function cell(val, x=0, y=0, dy=0, o={}) {
  var a = Object.assign({}, o, {x: x+o.x, y: y+o.y});
  for(var i=0, I=val.length, z=''; i<I; i++, a.y+=dy)
    z += tag('tspan', val[i], ' role="cell"', a);
  return z;
};

function column(nam, val, x=0, y=0, dy=0, ho={}, co={}) {
  var cnt = head(nam, x, y, ho)+cell(val, x, y+dy, dy, co);
  return tag('text', cnt, ' role="column"', {});
};

function defaults(w=0, h=0, x=0, y=0, dx=0, dy=0, o={}) {
  var fnt = 0.5*Math.min(dx, dy);
  var title = Object.assign({x: 0, y: 0, height: dy, 'font-family': 'Verdana', 'font-size': `${fnt}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, o.title);
  var table = Object.assign({transform: 'translate(0, 0)', 'font-family': 'Courier', 'font-size': `${fnt}px`, 'text-anchor': 'middle'}, o.table);
  var strip = Object.assign({x: -0.02*w, y: 0.4*dy, width: 1.04*w, height: dy, fill: 'papayawhip'}, o.strip);
  var head = Object.assign({x: 0.5*dx, y: 0, 'font-weight': 'bold', fill: 'crimson'}, o.head);
  var main = Object.assign({x: 0.5*dx, y: 0, 'font-weight': 'bold'}, o.main, o.cell);
  var cell = Object.assign({x: 0.5*dx, y: 0}, o.cell);
  var svg = Object.assign({width: w+2*x, height: title.height+h+2*y}, o.svg);
  return Object.assign({}, o, {svg, title, table, strip, head, main, cell});
};

function table(dat, x=30, y=30, dx=150, dy=40, o={}) {
  var val = dat.value, K = Object.keys(val);
  var nc = K.length, nr = nc>0? (val[K[0]].text||[]).length:0;
  var w = nc*dx, h = (nr+1)*dy, o = defaults(w, h, x, y, dx, dy, o);
  var ttl = title(dat.title, x+0.5*w, y, o.title), man = dat.main||'name';
  var t = strip(Math.floor(nr/2), x, (y+=o.title.height)+dy, dy*2, w, dy, o.strip);
  for(var i=0; i<nc; i++, x+=dx) {
    var k = K[i], oc = k===man? o.main:o.cell;
    t += column(val[k].name||k, val[k].text, x, y, dy, o.head, oc);
    if(typeof val[k].value==='string') x += dx;
  }
  t = ttl+tag('g', t, ' role="table"', o.table);
  return svg(t, o.svg);
};
module.exports = table;
