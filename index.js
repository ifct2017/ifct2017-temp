const pgconfig = require('pg-connection-string');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const pg = require('pg');
const data = require('./data');
const inp = require('./inp');
const out = require('./out');

const INTENT = new Map([
  ['query.select', botSelect]
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

async function botSelect(db, res) {
  var txt = res.resolvedQuery;
  var ans = await runNlp(db, txt), dat = ans.value;
  var tab = await out.image(out.table({title: txt, value: dat}));
  var y0 = {type: 0, speech: 'Let me think. Is this what you meant?'};
  var y1 = {type: 0, speech: `AQL: ${ans.aql}\nSQL: ${ans.sql}\n`};
  var y2 = {type: 0, speech: 'Please check the attached data here. Thanks.'};
  var z = [y0, y1, y2, {type: 3, imageUrl: tab}], gra = [];
  for(var k in dat) {
    if(!Array.isArray(dat[k].value)) continue;
    if(typeof dat[k].value[0]!=='number') continue;
    var title = dat[k].name+(dat[k].unit? ` (${dat[k].unit})`:'');
    gra.push(out.graph({title, subtitle: txt, value: {labels: dat.name.value, series: inp.sql.range(dat[k])}}).then(out.image));
  }
  var img = await Promise.all(gra);
  for(var i=0, I=img.length; i<I; i++)
    z.push({type: 3, imageUrl: img[i]});
  return z;
};

async function runBot(db, req) {
  var int = req.result.metadata.intentName;
  console.log(`BOT: ${int} | ${req.result.resolvedQuery}`);
  var msg = await INTENT.get(int)(db, req.result);
  return {speech: '', messages: msg, source: 'bot'};
};

server.listen(E.PORT||80);
server.on('listening', () => {
  const {port, family, address} = server.address();
  console.log(`server: listening on ${address}:${port} (${family})`);
});
data(db).then(() => console.log('data: ready'));

X.use(bodyParser.json());
X.use(bodyParser.urlencoded({'extended': true}));
X.all('/bot', (req, res, next) => {
  runBot(db, req.body).then((ans) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(ans));
  }).catch(next);
});
X.all('/sql/:txt', (req, res, next) => runSql(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.all('/aql/:txt', (req, res, next) => runAql(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.all('/nlp/:txt', (req, res, next) => runNlp(db, req.params.txt, req.query.mode||'').then((ans) => res.json(ans), next));
X.use((err, req, res, next) => {
  res.status(400).send(err.message);
  console.error(err);
});
