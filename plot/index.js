const chart = require('./chart');

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
chart('bar', data, options).then((ans) => console.log(ans));
chart('bar', data, options).then((ans) => console.log(ans));
chart('bar', data, options).then((ans) => console.log(ans));
chart('bar', data, options).then((ans) => console.log(ans));
