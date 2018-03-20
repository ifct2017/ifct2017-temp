// OUT
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

function defaults(dat, x, y, dx, dy, opt) {
  var title = opt.title||'';
  var nr = dat.length, nc = nr>0? dat[0].length:0;
  var head = opt.head||(new Array(nc)).fill('');
  var body = opt.body||(new Array(nr)).fill('');
  var to = Object.assign({transform: 'translate(0, 0)'}, opt.to||{});
  var ts_to = Object.assign({x: dx*0.25, y: });
};

function table(dat, x=0, y=0, dx=0, dy=0, opt={}) {
  var gv = tstrip(Math.floor(dat.length/2), x, y, dy*2, opt.tstrip.tso);
  gv += thead(head, x, y, dx, opt.thead.to, opt.thead.tho);
  for(var i=0, I=dat.length; i<I; i++)
    gv += tbody(body[i]||'', x, y+dy, dx, opt.tbody.to, opt.tbody.tho, opt.tbody.tro);
  gv = tag('g', gv, ` role="table"`, opt.to);
  gv = tag('title', titl)+gv;
  return tag('svg', gv, '', opt.so);
};


function tableOld(dat, opt) {
  var K = Object.keys(dat)
  if(K.length===0) return null;
  var z = '<tr>';
  for(var k of K)
    z += `<th>${k}</th>`;
  z += '</tr>';
  for(var i=0, I=dat[K[0]].length; i<I; i++) {
    z += '<tr>';
    for(var k of K)
      z += `<td>${dat[k][i]}</td>`;
    z += '</tr>';
  }
  z = `<body xmlns="http://www.w3.org/1999/xhtml"><table>${z}</table></body>`;
  z = `<foreignObject x="10" y="10" width="600" height="400">${z}</foreignObject>`;
  return `<svg xmlns="http://www.w3.org/2000/svg">${z}</svg>`;
};
module.exports = table;
