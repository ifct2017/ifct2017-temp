const pgconfig = require('pg-connection-string');
const bodyParser = require('body-parser');
const express = require('express');
const pg = require('pg');
const data = require('./data');
const sql = require('./sql');
const nlp = require('./nlp');
const http = require('http');

function rowsZip(rows) {
  var z = {};
  for(var k in rows[0]||{}) {
    for(var i=0, I=rows.length, y=[]; i<I; i++)
      y[i] = rows[i][k];
    z[k] = y;
  }
  return z;
};

function sqlRun(db, txt) {
  console.log(`AQL: ${txt}`);
  return sql(db, txt).then((sql) => {
    console.log(`SQL: ${sql}`);
    return db.query(sql).then((ans) => ({rows: rowsZip(ans.rows||[]), sql}));
  });
};

function nlpRun(db, txt) {
  console.log(`NLP: ${txt}`);
  return nlp(db, txt).then((aql) => sqlRun(db, aql).then((ans) => Object.assign(ans, {aql})));
};

var E = process.env;
var X = express();
var server = http.createServer(X);
var db = new pg.Pool(pgconfig(E.DATABASE_URL));
data(db).then(() => console.log('data: ready'));

server.listen(E.PORT||80);
server.on('listening', () => {
  const {port, family, address} = server.address();
  console.log(`server: listening on ${address}:${port} (${family})`);
});

X.use(bodyParser.json());
X.use(bodyParser.urlencoded({'extended': true}));
X.use((req, res, next) => {
  console.log();
  next();
});
X.all('/bot', (req, res) => {
  console.log('req.headers', req.headers);
  console.log('req.params', req.params);
  console.log('req.query', req.query);
  console.log('req.body', req.body);
  txt = "I like Indian Food Composition Tables!";
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ "speech": txt, "displayText": txt}));
});

X.all('/sql/:txt', (req, res) => sqlRun(db, req.params.txt).then((ans) => res.json(ans)));
X.all('/nlp/:txt', (req, res) => nlpRun(db, req.params.txt).then((ans) => res.json(ans)));
X.use((err, req, res, next) => {
  res.status(400).send(err.message);
  console.error(err);
});
