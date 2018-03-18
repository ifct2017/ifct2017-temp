const natural = require('natural');

const LANCASTER = /^(equal|below|small|less|low|above|great|high|more|large|big|boolean).*/;
const IGNORE = /^(a|an|the|i|he|him|she|her|they|their|as|at|if|in|is|it|of|on|to|by|want|well|than|then|thus|however|ok|okay)$/;
const OPERATOR = new Map([
  ['and bool', 'AND'],
  ['and', 'AND'],
  ['bool or', 'OR'],
  ['or', 'OR'],
  ['bool not', 'NOT'],
  ['not', 'NOT'],
  ['abov not same', '<'],
  ['gre not same', '<'],
  ['high not same', '<'],
  ['larg not same', '<'],
  ['mor not same', '<'],
  ['big not same', '<'],
  ['abov not or same', '<'],
  ['gre not or same', '<'],
  ['high not or same', '<'],
  ['larg not or same', '<'],
  ['mor not or same', '<'],
  ['big not or same', '<'],
  ['big eq not', '<'],
  ['eq mor not', '<'],
  ['eq larg not', '<'],
  ['eq high not', '<'],
  ['abov eq not', '<'],
  ['eq gre not', '<'],
  ['big eq not or', '<'],
  ['eq mor not or', '<'],
  ['eq larg not or', '<'],
  ['eq high not or', '<'],
  ['abov eq not or', '<'],
  ['eq gre not or', '<'],
  ['below', '<'],
  ['smal', '<'],
  ['less', '<'],
  ['low', '<'],
  ['<', '<'],
  ['not same smal', '>'],
  ['low not same', '>'],
  ['below not same', '>'],
  ['less not same', '>'],
  ['not or same smal', '>'],
  ['low not or same', '>'],
  ['below not or same', '>'],
  ['less not or same', '>'],
  ['eq not smal', '>'],
  ['eq low not', '>'],
  ['below eq not', '>'],
  ['eq less not', '>'],
  ['eq not or smal', '>'],
  ['eq low not or', '>'],
  ['below eq not or', '>'],
  ['eq less not or', '>'],
  ['abov', '>'],
  ['gre', '>'],
  ['high', '>'],
  ['larg', '>'],
  ['mor', '>'],
  ['big', '>'],
  ['>', '>'],
  ['same smal', '<='],
  ['low same', '<='],
  ['below same', '<='],
  ['less same', '<='],
  ['or same smal', '<='],
  ['low or same', '<='],
  ['below or same', '<='],
  ['less or same', '<='],
  ['eq smal', '<='],
  ['eq low', '<='],
  ['below eq', '<='],
  ['eq less', '<='],
  ['eq or smal', '<='],
  ['eq low or', '<='],
  ['below eq or', '<='],
  ['eq less or', '<='],
  ['abov not', '<='],
  ['gre not', '<='],
  ['high not', '<='],
  ['larg not', '<='],
  ['mor not', '<='],
  ['big not', '<='],
  ['< =', '<='],
  ['abov same', '>='],
  ['gre same', '>='],
  ['high same', '>='],
  ['larg same', '>='],
  ['mor same', '>='],
  ['big same', '>='],
  ['abov or same', '>='],
  ['gre or same', '>='],
  ['high or same', '>='],
  ['larg or same', '>='],
  ['mor or same', '>='],
  ['big or same', '>='],
  ['big eq', '>='],
  ['eq mor', '>='],
  ['eq larg', '>='],
  ['eq high', '>='],
  ['abov eq', '>='],
  ['eq gre', '>='],
  ['big eq or', '>='],
  ['eq mor or', '>='],
  ['eq larg or', '>='],
  ['eq high or', '>='],
  ['abov eq or', '>='],
  ['eq gre or', '>='],
  ['below not', '>='],
  ['not smal', '>='],
  ['less not', '>='],
  ['low not', '>='],
  ['> =', '>='],
  ['not same', '!='],
  ['eq not', '!='],
  ['differ', '!='],
  ['inequ', '!='],
  ['< >', '!='],
  ['! =', '!='],
  ['indiffer', '='],
  ['equival', '='],
  ['ident', '='],
  ['same', '='],
  ['eq', '='],
  ['is', '='],
  ['= =', '='],
  ['=', '='],
  ['diff from', 'IS DISTINCT FROM'],
  ['distinct from', 'IS DISTINCT FROM'],
  ['diff from is', 'IS DISTINCT FROM'],
  ['distinct from is', 'IS DISTINCT FROM'],
  ['diff from not', 'IS NOT DISTINCT FROM'],
  ['distinct from not', 'IS NOT DISTINCT FROM'],
  ['diff from is not', 'IS NOT DISTINCT FROM'],
  ['distinct from is not', 'IS NOT DISTINCT FROM'],
  ['between not', 'NOT BETWEEN SYMMETRIC'],
  ['not within', 'NOT BETWEEN SYMMETRIC'],
  ['between', 'BETWEEN SYMMETRIC'],
  ['within', 'BETWEEN SYMMETRIC'],
  ['is null', 'IS NULL'],
  ['is not null', 'IS NOT NULL'],
  ['is true', 'IS TRUE'],
  ['is not true', 'IS NOT TRUE'],
  ['false is', 'IS FALSE'],
  ['false is not', 'IS NOT FALSE'],
  ['is unknown', 'IS UNKNOWN'],
  ['is not unknown', 'IS NOT UNKNOWN'],
  ['addit', '+'],
  ['plu', '+'],
  ['sum', '+'],
  ['add', '+'],
  ['+', '+'],
  ['subtract', '-'],
  ['differ', '-'],
  ['minu', '-'],
  ['-', '-'],
  ['multipli', '*'],
  ['product', '*'],
  ['into', '*'],
  ['*', '*'],
  ['divis', '/'],
  ['divid', '/'],
  ['by', '/'],
  ['/', '/'],
  ['remaind', '%'],
  ['modulu', '%'],
  ['modulo', '%'],
  ['mod', '%'],
  ['%', '%'],
  ['exponenti', '^'],
  ['expon', '^'],
  ['power', '^'],
  ['pow', '^'],
  ['^', '^'],
  ['root squar', '|/'],
  ['root', '|/'],
  ['| /', '|/'],
  ['cube root', '|/'],
  ['| | /', '||/'],
  ['factori', '!'],
  ['! !', '!'],
  ['!', '!'],
  ['absolut valu', '@'],
  ['absolut', '@'],
  ['abs', '@'],
  ['@', '@'],
  ['and bitwis', '&'],
  ['and bit', '&'],
  ['&', '&'],
  ['bitwis or', '|'],
  ['bit or', '|'],
  ['|', '|'],
  ['bitwis xor', '#'],
  ['bit xor', '#'],
  ['#', '#'],
  ['bitwis not', '~'],
  ['bit not', '~'],
  ['~', '~'],
  ['bitwis left shift', '<<'],
  ['bit left shift', '<<'],
  ['left shift', '<<'],
  ['< <', '<<'],
  ['bitwis right shift', '>>'],
  ['bit right shift', '>>'],
  ['right shift', '>>'],
  ['> >', '>>'],
  ['case express match regular sensit', '~'],
  ['express match regular sensit', '~'],
  ['express match regular', '~'],
  ['case express insensit match regular', '~*'],
  ['express insensit match regular', '~*'],
  ['case express match not regular sensit', '!~'],
  ['express match not regular sensit', '!~'],
  ['express match not regular', '!~'],
  ['case express insensit match not regular', '!~*'],
  ['express insensit match not regular', '!~*'],
  ['escape', 'ESCAPE'],
  ['like', 'LIKE'],
  ['like not', 'NOT LIKE'],
  ['similar to', 'SIMILAR TO'],
  ['not similar to', 'NOT SIMILAR TO'],
  ['match', '@@'],
  ['@ @', '@@'],
  ['negat', '!!'],
  ['concaten', '||'],
  ['concat', '||'],
  ['| |', '||'],
  ['contains element', '@>'],
  ['contains range', '@>'],
  ['contains', '@>'],
  ['of superset', '<@'],
  ['@ >', '@>'],
  ['contained element', '<@'],
  ['contained range', '<@'],
  ['contained', '<@'],
  ['constituent of', '<@'],
  ['component of', '<@'],
  ['element of', '<@'],
  ['of portion', '<@'],
  ['member of', '<@'],
  ['of subset', '<@'],
  ['of piece', '<@'],
  ['of part', '<@'],
  ['< @', '<@'],
  ['common point', '&&'],
  ['intersects', '&&'],
  ['overlaps', '&&'],
  ['& &', '&&'],
  ['absolut left', '<<'],
  ['complet left', '<<'],
  ['exactli left', '<<'],
  ['exact left', '<<'],
  ['left rigidli', '<<'],
  ['left rigid', '<<'],
  ['left strictli', '<<'],
  ['left strict', '<<'],
  ['left pure', '<<'],
  ['absolut right', '>>'],
  ['complet right', '>>'],
  ['exactli right', '>>'],
  ['exact right', '>>'],
  ['right rigidli', '>>'],
  ['right rigid', '>>'],
  ['right strictli', '>>'],
  ['right strict', '>>'],
  ['pure right', '>>'],
  ['lengthen not right', '&<'],
  ['not right stretch', '&<'],
  ['not prolong right', '&<'],
  ['continu not right', '&<'],
  ['not right unfurl', '&<'],
  ['not right spread', '&<'],
  ['expand not right', '&<'],
  ['extend not right', '&<'],
  ['carri not right', '&<'],
  ['left lengthen not', '&>'],
  ['left not stretch', '&>'],
  ['left not prolong', '&>'],
  ['continu left not', '&>'],
  ['left not unfurl', '&>'],
  ['left not spread', '&>'],
  ['expand left not', '&>'],
  ['extend left not', '&>'],
  ['carri left not', '&>'],
  ['neighbour', '-|-'],
  ['alongsid', '-|-'],
  ['contigu', '-|-'],
  ['adjoin', '-|-'],
  ['touch', '-|-'],
  ['besid', '-|-'],
  ['adjac', '-|-'],
  ['- | -', '-|-'],
  ['union', '+'],
  ['∪', '+'],
  ['u', '+'],
  ['intersection', '*'],
  ['∩', '*'],
  ['complement rel', '-'],
  ['comp rel', '-'],
  ['differ', '-'],
  ['empti not', 'EXISTS'],
  ['not noth', 'EXISTS'],
  ['exist', 'EXISTS'],
  ['in', 'IN'],
  ['on', 'IN'],
  ['in not', 'NOT IN'],
  ['not on', 'NOT IN'],
  ['partial', 'ANY'],
  ['part', 'ANY'],
  ['some', 'ANY'],
  ['few', 'ANY'],
  ['ani', 'ANY'],
  ['everi on singl', 'ALL'],
  ['everi singl', 'ALL'],
  ['everi on', 'ALL'],
  ['everi', 'ALL'],
  ['each everi', 'ALL'],
  ['all', 'ALL']
]);
const FUNCTION = new Map([
  ['absolut valu', 'abs'],
  ['absolut', 'abs'],
  ['abs', 'abs'],
  ['cube root', 'cbrt'],
  ['cbrt', 'cbrt'],
  ['integ round up', 'ceil'],
  ['round up', 'ceil'],
  ['ceiling', 'ceil'],
  ['ceil', 'ceil'],
  ['degrees', 'degrees'],
  ['deg', 'degrees'],
  ['integ quotient', 'div'],
  ['divis integ', 'div'],
  ['div', 'div'],
  ['exponenti', 'exp'],
  ['expon', 'exp'],
  ['exp', 'exp'],
  ['integ round down', 'floor'],
  ['round down', 'floor'],
  ['floor', 'floor'],
  ['base e logarithm', 'ln'],
  ['base e log', 'ln'],
  ['logarithm natur', 'ln'],
  ['log natur', 'ln'],
  ['e logarithm', 'ln'],
  ['e log', 'ln'],
  ['loge', 'ln'],
  ['ln', 'ln'],
  ['base logarithm', 'log'],
  ['base log', 'log'],
  ['logarithm', 'log'],
  ['log10', 'log'],
  ['log', 'log'],
  ['divis remaind', 'mod'],
  ['remaind', 'mod'],
  ['modulu', 'mod'],
  ['modulo', 'mod'],
  ['mod', 'mod'],
  ['constant pi', 'pi'],
  ['pi', 'pi'],
  ['π', 'pi'],
  ['power rais', 'power'],
  ['power', 'power'],
  ['pow', 'power'],
  ['radians', 'radians'],
  ['rad', 'radians'],
  ['integ round', 'round'],
  ['round', 'round'],
  ['integ nearest round', 'round'],
  ['integ round', 'round'],
  ['round', 'round'],
  ['sign', 'sign'],
  ['sgn', 'sign'],
  ['root squar', 'sqrt'],
  ['root', 'sqrt'],
  ['sqrt', 'sqrt'],
  ['toward truncat zero', 'trunc'],
  ['truncat zero', 'trunc'],
  ['truncat', 'trunc'],
  ['trunc', 'trunc'],
  ['number random', 'random'],
  ['num random', 'random'],
  ['number rand', 'random'],
  ['num rand', 'random'],
  ['random', 'random'],
  ['rand', 'random'],
  ['random seed set', 'setseed'],
  ['rand seed set', 'setseed'],
  ['seed set', 'setseed'],
  ['random seed', 'setseed'],
  ['rand seed', 'setseed'],
  ['setseed', 'setseed'],
  ['cosin invers', 'acos'],
  ['co invers', 'acos'],
  ['cosin inv', 'acos'],
  ['co inv', 'acos'],
  ['aco', 'acos'],
  ['invers sine', 'asin'],
  ['invers sin', 'asin'],
  ['inv sine', 'asin'],
  ['inv sin', 'asin'],
  ['asin', 'asin'],
  ['invers tangent', 'atan'],
  ['invers tan', 'atan'],
  ['inv tangent', 'atan'],
  ['inv tan', 'atan'],
  ['atan', 'atan'],
  ['invers tangent y / x', 'atan2'],
  ['invers tangent yx', 'atan2'],
  ['invers tangent 2', 'atan2'],
  ['invers tan y / x', 'atan2'],
  ['invers tan yx', 'atan2'],
  ['invers tan 2', 'atan2'],
  ['inv tangent y / x', 'atan2'],
  ['inv tangent yx', 'atan2'],
  ['inv tangent 2', 'atan2'],
  ['inv tan y / x', 'atan2'],
  ['inv tan yx', 'atan2'],
  ['inv tan 2', 'atan2'],
  ['atan2', 'atan2'],
  ['co', 'cos'],
  ['cosin', 'cos'],
  ['co', 'cos'],
  ['cotang', 'cot'],
  ['cot', 'cot'],
  ['sine', 'sin'],
  ['sin', 'sin'],
  ['tangent', 'tan'],
  ['tan', 'tan'],
  ['bit number string', 'bit_length'],
  ['bit length string', 'bit_length'],
  ['bit number', 'bit_length'],
  ['bit length', 'bit_length'],
  ['bit num', 'bit_length'],
  ['bit len', 'bit_length'],
  ['bit_length', 'bit_length'],
  ['bit_len', 'bit_length'],
  ['charact number string', 'char_length'],
  ['charact length string', 'char_length'],
  ['charact number', 'char_length'],
  ['charact length', 'char_length'],
  ['char number', 'char_length'],
  ['char length', 'char_length'],
  ['charact num', 'char_length'],
  ['charact len', 'char_length'],
  ['char num', 'char_length'],
  ['char len', 'char_length'],
  ['character_length', 'char_length'],
  ['char_length', 'char_length'],
  ['character_len', 'char_length'],
  ['char_len', 'char_length'],
  ['case convert low string', 'lower'],
  ['case convert low', 'lower'],
  ['case low string', 'lower'],
  ['case low', 'lower'],
  ['tolowercase', 'lower'],
  ['lowercase', 'lower'],
  ['tolcase', 'lower'],
  ['lcase', 'lower'],
  ['tolower', 'lower'],
  ['low', 'lower'],
  ['locat string', 'strpos'],
  ['locat', 'strpos'],
  ['index string', 'strpos'],
  ['index', 'strpos'],
  ['posit string', 'strpos'],
  ['posit', 'strpos'],
  ['indexof', 'strpos'],
  ['strpos', 'strpos'],
  ['extract substr', 'substr'],
  ['substr', 'substr'],
  ['and lead space trail trim', 'btrim'],
  ['and lead trail trim', 'btrim'],
  ['lead trail trim', 'btrim'],
  ['and left right space trim', 'btrim'],
  ['and left right trim', 'btrim'],
  ['left right trim', 'btrim'],
  ['both end trim', 'btrim'],
  ['both trim', 'btrim'],
  ['trim', 'btrim'],
  ['btrim', 'btrim'],
  ['lead space trim', 'ltrim'],
  ['lead trim', 'ltrim'],
  ['left space trim', 'ltrim'],
  ['left trim', 'ltrim'],
  ['ltrim', 'ltrim'],
  ['space trail trim', 'rtrim'],
  ['trail trim', 'rtrim'],
  ['right space trim', 'rtrim'],
  ['right trim', 'rtrim'],
  ['rtrim', 'rtrim'],
  ['case convert string upper', 'upper'],
  ['case convert upper', 'upper'],
  ['case string upper', 'upper'],
  ['case upper', 'upper'],
  ['touppercase', 'upper'],
  ['uppercase', 'upper'],
  ['toucase', 'upper'],
  ['ucase', 'upper'],
  ['toupper', 'upper'],
  ['upper', 'upper'],
  ['asci cod', 'ascii'],
  ['asci', 'ascii'],
  ['asc', 'ascii'],
  ['charact', 'chr'],
  ['char', 'chr'],
  ['chr', 'chr'],
  ['capit charact init', 'initcap'],
  ['capit char init', 'initcap'],
  ['cap char init', 'initcap'],
  ['cap init', 'initcap'],
  ['case titl', 'initcap'],
  ['totitlecase', 'initcap'],
  ['titlecase', 'initcap'],
  ['totcase', 'initcap'],
  ['tcase', 'initcap'],
  ['initcap', 'initcap'],
  ['left subst', 'left'],
  ['left', 'left'],
  ['leng', 'length'],
  ['len', 'length'],
  ['siz', 'length'],
  ['left pad spac', 'lpad'],
  ['left pad', 'lpad'],
  ['lpad', 'lpad'],
  ['hash md5', 'md5'],
  ['md5', 'md5'],
  ['express regul replac', 'regexp_replace'],
  ['regexp replac', 'regexp_replace'],
  ['regexp_replace', 'regexp_replace'],
  ['rep string', 'repeat'],
  ['rep', 'repeat'],
  ['replac subst', 'replace'],
  ['replac string', 'replace'],
  ['replac', 'replace'],
  ['revers string', 'reverse'],
  ['revers', 'reverse'],
  ['right subst', 'right'],
  ['right', 'right'],
  ['pad right spac', 'rpad'],
  ['pad right', 'rpad'],
  ['rpad', 'rpad'],
  ['part split string', 'split_part'],
  ['part split', 'split_part'],
  ['split string', 'split_part'],
  ['split', 'split_part'],
  ['split_part', 'split_part'],
  ['string to', 'to_char'],
  ['charact to', 'to_char'],
  ['tostring', 'to_char'],
  ['to_char', 'to_char'],
  ['dat to', 'to_date'],
  ['to_date', 'to_date'],
  ['number to', 'to_number'],
  ['integ to', 'to_number'],
  ['num to', 'to_number'],
  ['int to', 'to_number'],
  ['to_number', 'to_number'],
  ['timestamp to', 'to_timestamp'],
  ['time to', 'to_timestamp'],
  ['to_timestamp', 'to_timestamp'],
  ['coalesc', 'coalesce'],
  ['if null', 'nullif'],
  ['nullif', 'nullif'],
  ['maximum', 'greatest'],
  ['max', 'greatest'],
  ['greatest', 'greatest'],
  ['biggest', 'greatest'],
  ['largest', 'greatest'],
  ['minimum', 'lowest'],
  ['min', 'lowest'],
  ['smallest', 'lowest'],
  ['lowest', 'lowest'],
  ['least', 'lowest'],
  ['mean', 'avg'],
  ['averag', 'avg'],
  ['avg', 'avg'],
  ['and bitwis', 'bit_and'],
  ['and bit', 'bit_and'],
  ['everi', 'bit_and'],
  ['bit_and', 'bit_and'],
  ['bitwis or', 'bit_or'],
  ['bit or', 'bit_or'],
  ['bit_or', 'bit_or'],
  ['and bool', 'bool_and'],
  ['and', 'bool_and'],
  ['bool_and', 'bool_and'],
  ['bool_and', 'bool_and'],
  ['bool or', 'bool_or'],
  ['or', 'bool_or'],
  ['bool_or', 'bool_or'],
  ['count row', 'count'],
  ['count', 'count'],
  ['maximum', 'max'],
  ['max', 'max'],
  ['minimum', 'min'],
  ['min', 'min'],
  ['sum', 'sum'],
]);
const KEYWORD = new Map([
  ['show', 'SELECT'],
  ['list', 'SELECT'],
  ['select', 'SELECT'],
  ['from', 'FROM'],
  ['as', 'AS'],
  ['which', 'WHERE'],
  ['with', 'WHERE'],
  ['have', 'WHERE'],
  ['has', 'WHERE'],
  ['where', 'WHERE'],
  ['most', 'ORDER BY'],
  ['least', 'ORDER BY'],
  ['arrang', 'ORDER BY'],
  ['sort', 'ORDER BY'],
  ['order', 'ORDER BY'],
  ['group', 'GROUP BY'],
  ['classifi', 'GROUP BY'],
  ['uniqu', 'DISTINCT'],
  ['distinct', 'DISTINCT'],
  ['ascend', 'ASC'],
  ['worst', 'ASC'],
  ['least', 'ASC'],
  ['lowest', 'ASC'],
  ['descend', 'DESC'],
  ['best', 'DESC'],
  ['most', 'DESC'],
  ['highest', 'DESC'],
  ['limit', 'LIMIT'],
  ['top', 'LIMIT'],
  ['bottom', 'DESC LIMIT'],
]);
const STEP = [
  (wrds) => wrds.slice(),
  (wrds) => wrds.filter((v) => !IGNORE.test(v)),
  (wrds) => wrds.map(stem),
  (wrds) => wrds.filter((v) => !IGNORE.test(v)).map(stem)
];

function stem(wrd) {
  if(!LANCASTER.test(wrd)) return natural.PorterStemmer.stem(wrd);
  return natural.LancasterStemmer.stem(wrd);
};

function findLast(tkns, bgn, typ) {
  var z = -1;
  for(var i=bgn, I=tkns.length; i<I; z=i++)
    if(tkns[i].type!==typ) break;
  return z;
};

function processTxt(txt) {
  if(OPERATOR.has(txt)) return {type: 'operator', value: OPERATOR.get(txt)};
  if(FUNCTION.has(txt)) return {type: 'function', value: FUNCTION.get(txt)};
  if(KEYWORD.has(txt)) return {type: 'keyword', value: KEYWORD.get(txt)};
  return null;
};

function process(wrds) {
  var z = null;
  for(var i=0, I=STEP.length; i<I && z==null; i++)
    z = processTxt(STEP[i](wrds).sort().join(' '));
  return z;
};

function reserved(tkns) {
  var z = [];
  for(var i=0, I=tkns.length; i<I; i++) {
    var J = findLast(tkns, i, 'text');
    if(J<0) { z.push(tkns[i]); continue; }
    var wrds = tkns.slice(i, J+1).map((v) => v.value.toLowerCase());
    for(var j=J; j>=i; j--) {
      var rsv = process(wrds);
      if(rsv!=null) { z.push(rsv); i = j; break; }
      wrds.pop();
    }
    if(j<i) z.push(tkns[i]);
  }
  return z;
};
module.exports = reserved;
