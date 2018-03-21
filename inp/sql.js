function sql(db, txt, col=false) {
  return db.query(txt).then((ans) => {
    if(!col) return ans.rows;
    for(var i=0, I=ans.rowCount, z={}; i<I; i++) {
      var row = ans.rows[i];
      for(var k in row)
        z[k][i] = row[k];
    }
    return z;
  });
};
module.exports = sql;
