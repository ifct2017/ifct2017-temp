require('./window');
const Chartist = require('chartist');

const FUNCTION = new Map([
  ['bar', Chartist.Bar],
  ['line', Chartist.Line],
  ['pie', Chartist.Pie],
]);
var chartNum = 0;

function chart(typ, dat, opt) {
  chartNum = (chartNum+1)%65536;
  var div = document.createElement('div');
  document.querySelector('svg').appendChild(div);
  div.id = 'c'+chartNum;
  var svg = new (FUNCTION.get(typ))(div, dat, opt);
  return new Promise((fres) => {
    svg.on('created', (data) => {
      window.setComputedStyle(div);
      var txt = div.innerHTML;
      div.parentNode.removeChild(div);
      fres(txt);
    });
  });
};
module.exports = chart;
