const pgconfig = require('pg-connection-string');
const bodyParser = require('body-parser');
const express = require('express');
const pg = require('pg');
const http = require('http');
const data = require('./data');
const inp = require('./inp');
const out = require('./out');

const INTENT = new Map([
  ['query.abbreviation', botAbbreviation],
  ['query.food', botFood],
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

async function botAbbreviation(db, res) {
  var txt = res.parameters['abbreviations-code']||'';
  var key = txt.replace(/\.\-/g, '').toLowerCase();
  return `${txt} stands for ${data.ABBREVIATIONS.get(key)}.`;
};

async function botFood(db, res) {
  var txt = (res.parameters['compositions-text']||[]).join(' ').replace(/[^\w ]/g, ' ');
  var sql = `SELECT * FROM "compositions_tsvector" WHERE "tsvector" @@ plainto_tsquery('${txt}')`;
  var ans = await runSql(db, sql+` ORDER BY ts_rank("tsvector", plainto_tsquery('${txt}'), 2) DESC LIMIT 1`, 'groups');
  var img = `https://unpkg.com/@ifct2017/pictures/${ans.value.code.value[0]}.jpeg`;
  console.log('BOT.FOOD: image='+img);
  var ord = inp.sql.order(ans.value, 0), val = inp.sql.toTexts(inp.sql.toUnits(ans.value));
  var title = val.name.text[0], subtitle = val.scie.text[0], row = inp.sql.row(val, 0, ord);
  var tab = await out.image(out.table({title: val.name.text[0], value: row}));
  console.log('BOT.FOOD: table='+tab);
  return [{buttons: [], imageUrl: img, subtitle, title, type: 1}, {imageUrl: tab, type: 3}];
};

async function botSelect(db, res) {
  var txt = res.resolvedQuery;
  var ans = await runNlp(db, txt), dat = ans.value;
  console.log('BOT.SELECT: SQL query result obtained.');
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
  console.log('BOT.SELECT: Table and charts generated.');
  var url = await Promise.all(rdy);
  for(var i=0, I=url.length; i<I; i++) {
    console.log('BOT.SELECT: '+(i===0? 'table=':'chart=')+url[i]);
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
