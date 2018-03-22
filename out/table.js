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
  var ar = Object.assign({}, o.cell, {x: x+dx+o.cell.x});
  var th = tag('tspan', nam, ' role="rowheader"', ah);
  for(var i=0, I=val.length, tr=''; i<I; i++, ar.x+=dx)
    tr += tag('tspan', val[i], ' role="cell"', ar);
  return tag('text', th+tr, ' role="row"', a);
};

function defaults(w=0, h=0, x=0, y=0, dx=0, dy=0, o={}) {
  var fnt = 0.5*Math.min(dx, dy);
  var title = Object.assign({x: 0, y: 0, height: dy, 'font-family': 'Verdana', 'font-size': `${fnt}px`, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'middle'}, o.title);
  var table = Object.assign({transform: 'translate(0, 0)', 'font-family': 'Courier', 'font-size': `${fnt}px`, 'text-anchor': 'middle'}, o.table);
  var strip = Object.assign({x: -0.02*w, y: 0.4*dy, width: 1.04*w, height: dy, fill: 'papayawhip'}, o.strip);
  var svg = Object.assign({width: w+2*x, height: title.height+h+2*y}, o.svg);
  var thead = Object.assign({source: 'name'}, o.thead), tbody = Object.assign({}, o.tbody);
  thead.root = Object.assign({y: 0, 'font-weight': 'bold', fill: 'crimson'}, thead.root);
  thead.head = Object.assign({x: 0.5*dx}, thead.head);
  tbody.root = Object.assign({y:0}, tbody.root);
  tbody.head = Object.assign({x:0, 'font-weight': 'bold', fill: 'crimson', 'text-anchor': 'start'}, tbody.head);
  tbody.cell = Object.assign({x: 0.5*dx}, tbody.cell);
  return Object.assign({}, o, {svg, title, table, strip, thead, tbody});
};

function table(dat, x=30, y=30, dx=150, dy=40, o={}) {
  console.log(JSON.stringify(dat));
  var val = dat.value, K = Object.keys(val);
  var nr = K.length, nc = nr>0? (val[K[0]].text||[]).length:0;
  var w = (nc+1)*dx, h = (nr+1)*dy;
  console.log(w, h);
  var o = defaults(w, h, x, y, dx, dy, o);
  var ttl = title(dat.title, x+0.5*w, y, o.title);
  var t = strip(Math.floor(nr/2), x, (y+=o.title.height), dy*2, w, dy, o.strip);
  t += thead(val[o.thead.source].text, x, y, dx, o.thead);
  for(var i=0, y=y+dy; i<nr; i++, y+=dy)
    t += tbody(val[K[i]].name||K[i], val[K[i]].text, x, y, dx, o.tbody);
  t = ttl+tag('g', t, ' role="table"', o.table);
  return svg(t, o.svg);
};
module.exports = table;
