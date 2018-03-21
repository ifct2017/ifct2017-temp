const pgconfig = require('pg-connection-string');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const pg = require('pg');
const data = require('./data');
const inp = require('./inp');

function sqlRun(db, txt, col=false) {
  console.log(`AQL: ${txt}`);
  return inp.aql(db, txt).then((sql) => {
    console.log(`SQL: ${sql}`);
    return inp.sql(sql);
  });
};

function nlpRun(db, txt, col=false) {
  console.log(`NLP: ${txt}`);
  return nlp(db, txt).then((aql) => sqlRun(db, aql, col).then((ans) => Object.assign(ans, {aql})));
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
  res.send(JSON.stringify({payload: {facebook: {text: txt}}}));
});
X.all('/sql/:txt', (req, res) => sqlRun(db, req.params.txt, req.query.mode==='column').then((ans) => res.json(ans)));
X.all('/nlp/:txt', (req, res) => nlpRun(db, req.params.txt, req.query.mode==='column').then((ans) => res.json(ans)));
X.use((err, req, res, next) => {
  res.status(400).send(err.message);
  console.error(err);
});
