// Wrapper that makes sql.js behave like better-sqlite3 API
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  get() {
    const params = Array.from(arguments);
    try {
      const stmt = this.db._db.prepare(this.sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const row = {};
        cols.forEach(function(c, i) { row[c] = vals[i]; });
        return row;
      }
      stmt.free();
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  all() {
    const params = Array.from(arguments);
    try {
      const stmt = this.db._db.prepare(this.sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach(function(c, i) { row[c] = vals[i]; });
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (e) {
      throw e;
    }
  }

  run() {
    const params = Array.from(arguments);
    try {
      const stmt = this.db._db.prepare(this.sql);
      if (params.length > 0) stmt.bind(params);
      stmt.step();
      stmt.free();
      const info = {
        changes: this.db._db.getRowsModified(),
        lastInsertRowid: this.db.lastInsertRowId()
      };
      this.db._save();
      return info;
    } catch (e) {
      throw e;
    }
  }
}

class Database {
  constructor(dbPath) {
    this._dbPath = dbPath;
    this._db = null;
    this._sqlJs = null;
  }

  async init() {
    const SQL = await initSqlJs();
    this._sqlJs = SQL;
    if (fs.existsSync(this._dbPath)) {
      const buffer = fs.readFileSync(this._dbPath);
      this._db = new SQL.Database(buffer);
    } else {
      this._db = new SQL.Database();
    }
    return this;
  }

  lastInsertRowId() {
    const result = this._db.exec('SELECT last_insert_rowid() as id');
    return result.length > 0 ? result[0].values[0][0] : 0;
  }

  pragma(str) {
    try {
      this._db.run('PRAGMA ' + str);
    } catch (e) {
      // ignore pragma errors
    }
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  prepare(sql) {
    return new Statement(this, sql);
  }

  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this._dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this._dbPath, buffer);
  }

  close() {
    if (this._db) {
      this._save();
      this._db.close();
    }
  }
}

module.exports = Database;
