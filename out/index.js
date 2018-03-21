const chart = require('./chart');
// const table = require('./table');

var data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};
var options = {
  caption: 'rapped inside Plastic\'s Lair',
  ccaption: {'font-family': 'Verdana'},
  width: 1000,
  height: 600,
  seriesBarDistance: 30
};
// chart('bar', data, options).then((ans) => console.log(ans));

var ans = {"name":["Apple, big","Apple, green","Apple, small","Apple, small, Kashmir","Custard apple"],"fsugar":[9.53,8.39,9.8,9.15,13.35],"lactose":[0,0,0,0,0],"cho":[9.53,8.39,9.8,9.15,13.69],"sucs":[0.14,0.12,0.11,0.37,0],"mals":[0,0,0,0,0],"glus":[1.03,1.08,1.17,1.6,4.25],"frus":[8.36,7.19,8.52,7.18,9.1]};
chart('line', data, options).then(console.log)
