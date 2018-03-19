function table(dat, opt) {
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
