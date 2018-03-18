const pg = require('pg');
const pgconfig = require('pg-connection-string');
const data = require('./data');
const sql = require('./sql');
const http = require('http');
const uuidv1 = require('uuid/v1');
const express = require('express');
const bodyParser = require('body-parser');
const nlp = require('./nlp');

var E = process.env;
var X = express();
var server = http.createServer(X);
var db = new pg.Pool(pgconfig(E.DATABASE_URL));

server.listen(E.PORT||80);
server.on('listening', () => {
  const {port, family, address} = server.address();
  console.log(`server: listening on ${address}:${port} (${family})`);
});

X.use(bodyParser.json());
X.use(bodyParser.urlencoded({'extended': true}));
X.all('/sql', (req, res) => {
  console.log('req.headers', req.headers);
  console.log('req.params', req.params);
  console.log('req.query', req.query);
  console.log('req.body', req.body);
  txt = "I like Indian Food Composition Tables!";
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ "speech": txt, "displayText": txt}));
});

data(db).then(
  () => console.log('data: ready')).then(
  () => sql(db, `SELECT "title", "all: vitamin" FROM "apples" WHERE ("proximates">0 and "soluble fibre">0)`)).then(
  (ans) => console.log(ans)).then(
  () => nlp(db)
);
