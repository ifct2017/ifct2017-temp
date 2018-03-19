const dom = require('./dom');
const Chartist = require('chartist');



var show = true;
var data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};
var options = {
  width: 600,
  height: 400,
  seriesBarDistance: 30
};
line = new Chartist.Bar('body', data, options);
line.on('created', (data) => {
  var div = document.querySelector('body');
  for(var ctGrid of [document.querySelector('.ct-grid')]) {
    console.log(ctGrid.outerHTML);
    console.log(window.getComputedStyle(ctGrid).toString());
  }
});
