const pgconfig = require('pg-connection-string');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const pg = require('pg');
const data = require('./data');
const inp = require('./inp');
const out = require('./out');

const INTENT = new Map([
  ['query.abbreviation', botAbbreviation],
  ['query.select', botSelect],
]);
const E = process.env;
var X = express();
var server = http.createServer(X);
var db = new pg.Pool(pgconfig(E.DATABASE_URL+'?ssl=true'));

async function runSql(db, sql, mod='text') {
  console.log(`SQL: ${sql}`);
  var ans = await inp.sql(db, sql);
  do {
    if(mod==='rows') break;
    ans = inp.sql.toColumns(ans);
    if(mod==='columns') break;
    ans = inp.sql.toGroups(ans);
    if(mod==='groups') break;
    ans = inp.sql.toUnits(ans);
    if(mod==='units') break;
    ans = inp.sql.toTexts(ans);
  } while(false);
  return {sql, value: ans};
};

async function runAql(db, aql, mod='text') {
  console.log(`AQL: ${aql}`);
  var sql = await inp.aql(db, aql);
  return Object.assign({aql}, await runSql(db, sql, mod));
};

async function runNlp(db, nlp, mod='text') {
  console.log(`NLP: ${nlp}`);
  var aql = await inp.nlp(db, nlp);
  return Object.assign({nlp}, await runAql(db, aql, mod));
};

function botAbbreviation(res) {
  var txt = res.parameters['abbreviations-code']||'';
  var key = txt.replace(/\./g, '').toLowerCase();
  return `${txt} stands for ${data.abbreviations.get(key)}.`;
};

async function botSelect(db, res) {
  var txt = res.resolvedQuery;
  var ans = await runNlp(db, txt), dat = ans.value;
  console.log('SQL query result obtained.');
  var y0 = {type: 0, speech: 'Let me think. Is this what you meant?'};
  var y1 = {type: 0, speech: 'AQL: '+ans.aql};
  var y2 = {type: 0, speech: 'SQL: '+ans.sql};
  var y3 = {type: 0, speech: 'Please check the attached data here. Thanks.'};
  var z = [y0, y1, y2, y3], rdy = [out.image(out.table({title: txt, value: dat}))];
  for(var k in dat) {
    if(!Array.isArray(dat[k].value)) continue;
    if(typeof dat[k].value[0]!=='number') continue;
    var title = dat[k].name+(dat[k].unit? ` (${dat[k].unit})`:'');
    rdy.push(out.chart({title, subtitle: txt, value: {labels: dat.name.value, series: inp.sql.range(dat[k])}}).then(out.image));
  }
  console.log('Table and charts generated.');
  var url = await Promise.all(rdy);
  for(var i=0, I=url.length; i<I; i++) {
    console.log((i===0? 'TABLE: ':'CHART: ')+url[i]);
    z.push({type: 3, imageUrl: url[i]});
  }
  return z;
};

async function runBot(db, req) {
  var int = req.result.metadata.intentName;
  var src = req.originalRequest? req.originalRequest.data.source:req.result.source;
  console.log(`BOT: ${src} | ${int}`);
  var msg = await INTENT.get(int)(db, req.result);
  if(typeof msg==='string') return {speech: msg, source: 'bot'};
  return {speech: '', messages: msg, source: 'bot'};
};

server.listen(E.PORT||80);
server.on('listening', () => {
  const {port, family, address} = server.address();
  console.log(`SERVER: listening on channel ${address}:${port} (${family})`);
});
data(db).then(() => console.log('DATA: over construction'));

X.use(bodyParser.json());
X.use(bodyParser.urlencoded({'extended': true}));
X.all('/bot', (req, res, next) => {
  runBot(db, req.body).then((ans) => res.json(ans)).catch(next);
});
X.all('/bot/select/:txt', (req, res, next) => botSelect(db, {resolvedQuery: req.params.txt}).then((ans) => res.json(ans), next));
X.all('/sql/:txt', (req, res, next) => runSql(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.all('/aql/:txt', (req, res, next) => runAql(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.all('/nlp/:txt', (req, res, next) => runNlp(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.use('/assets', express.static('assets'));
X.use((err, req, res, next) => {
  res.status(400).send(err.message);
  console.error(err);
});
