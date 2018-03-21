const nlp = require('./nlp');
const aql = require('./aql');
const sql = require('./sql');
const out = require('./out');

const INTENT = new Map([
  ['query.select', querySelect]
]);

async function querySelect(db, res) {
  var txt = res.resolvedQuery;
  var taq = await nlp(db, txt);
  var tsq = await aql(db, taq);
  var ans = await sql(db, tsq);
  var tab = await out.image(out.table(ans));
  var z = `Let me think. Is this what you meant?\nAQL: ${taq}\nSQL: ${tsq}\n`;
  z += `Please check the attached table here. Thanks.`;
  return [{type: 0, speech: z}, {type: 3, imageUrl: tab}];
};

async function bot(db, req) {
  var int = req.metadata.intentName;
  var msg = await INTENT.get(int)(db, req.result);
  return {speech: '', messages: msg, source: 'bot'};
};
module.exports = bot;
