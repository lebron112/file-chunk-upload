const sqlite3 = require('sqlite3').verbose();
const log4js = require('log4js');
const logger = log4js.getLogger('app');
const moment = require('dayjs');
const fs = require('fs');
const result = fs.existsSync('./database');
if (!result) fs.mkdirSync('./database');

const db = new sqlite3.Database('database/data.db', (err) => {
  if (err) return logger.error('✖️   ', err);
  logger.info('✔️    connect database file success.');
});

const FindOptions = {
  Between: (a, b) => ({ type: 'between', min: a, max: b }),
  MoreThan: (a) => ({ type: 'moreThan', min: a }),
  LessThan: (a) => ({ type: 'lessThan', max: a }),
  Not: (a) => ({ type: 'not', val: a }),
  NotIn: (a) => ({ type: 'notIn', val: a }),
  In: (a) => ({ type: 'in', val: a }),
  Like: (a) => ({ type: 'like', val: a }),
};

const sqliteFindJob = (str) => new Promise((reslove, reject) => {
  db.all(str, (err, rows) => {
    if (err) {
      logger.error(err);
      return reject(err);
    }
    reslove(rows);
  });
});

const dbTypes = {
  TEXT: 'TEXT',
  integer: 'integer',
  CHAR: 'CHAR',
  INT: 'INT',
};
// 创建表语句
const defineModel = (options) => {
  const tableName = options.tableName;
  const formateSqlStr = (headerSql, where) => {
    let sql = headerSql;
    const keys = Object.keys(where);
    if (keys.length) {
      sql += ' where';
      for (const i in where) {
        const item = where[i];
        const start = ` ${keys.indexOf(i) === 0 ? '' : 'and'}`;
        if (Object.prototype.toString.call(item) === '[object Object]' && item.type) {
          if (item.type === 'between') sql += ` ${start} ${i} between ${JSON.stringify(item.min)} and ${JSON.stringify(item.max)}`;
          if (item.type === 'moreThan') sql += ` ${start} ${i} >= ${JSON.stringify(item.min)}`;
          if (item.type === 'lessThan') sql += ` ${start} ${i} <= ${JSON.stringify(item.max)}`;
          if (item.type === 'not') sql += ` ${start} ${i} != ${JSON.stringify(item.val)}`;
          if (item.type === 'in') sql += ` ${start} ${i} in ( ${item.val.map(i => JSON.stringify(i)).join(' ,')} )`;
          if (item.type === 'notIn') sql += ` ${start} ${i} not in ( ${item.val.map(i => JSON.stringify(i)).join(' ,')} )`;
          if (item.type === 'like') sql += ` ${start} ${i} like '%${item.val}%' `;
        } else {
          const val = where[i] === null ? 'NULL' : JSON.stringify(where[i]);
          sql += ` ${start} ${i} = ${val}`;
        }
      }
    }
    return sql;
  };
  const delWhereSqlStr = (where) => {
    if (!where) throw 'missing where conditions';
    let sql = `delete from ${tableName}`;
    return formateSqlStr(sql, where);
  };
  // 查询语句
  const whereSqlStr = (where, select, isCount) => {
    if (!where) throw 'missing where conditions';
    let sql = isCount ? `select count(*) as total from ${tableName}` :
      `select ${select ? select.join(', ') : '*'} from ${tableName}`;
    return formateSqlStr(sql, where);
  };
  const useCreadAt = options.colums.find(item => item.key === 'createdAt');
  const useUpdatedAt = options.colums.find(item => item.key === 'updatedAt');
  return {
    sql: db,
    // 创建单条数据方法
    create: async (data) => {
      return new Promise((reslove, reject) => {
        const keys = useCreadAt ? ['createdAt'] : [];
        const insertData = useCreadAt ? {
          $createdAt: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
        } : {};
        for (const i in data) {
          if (data.hasOwnProperty(i)) {
            keys.push(i);
            insertData['$' + i] = data[i];
          }
        }

        const sql = `insert into ${tableName} (${keys.join(' ,')}) values (${keys.map(item => '$' + item).join(' ,')})`;

        db.run(sql, insertData, (err, rows) => {
          if (err) {
            logger.error(err);
            return reject(err);
          }
          reslove(rows);
        });
      });
    },
    // 查询单条数据
    findOne: async ({ where, select, order }) => {
      let sql = whereSqlStr(where, select);
      if (order) sql += ` order by ${order[0]} ${order[1]}`;
      sql += ' limit 1';
      const data = await sqliteFindJob(sql);
      return data.length ? data[0] : null;
    },
    // 删除
    delete: async ({ where }) => {
      if (!where) throw 'missing where conditions';
      if (!Object.keys(where).length) throw 'missing where conditions';
      let delWhereSql = delWhereSqlStr(where);
      return new Promise((reslove, reject) => {
        db.run(delWhereSql, (err, rows) => {
          if (err) {
            logger.error(err);
            return reject(err);
          }
          reslove(rows || null);
        });
      });
    },
    // 普通查找
    findAll: async ({ where, select, limit, offset, order }) => {
      let sql = whereSqlStr(where, select);
      if (order) sql += ` order by ${order[0]} ${order[1]}`;
      if (limit) sql += ` limit ${limit}`;
      if (offset) sql += ` offset ${offset}`;
      const data = await sqliteFindJob(sql);
      return data;
    },
    //分页查询
    findAndCount: async ({ where, select, limit, offset, order }) => {
      let whereSql = whereSqlStr(where, select);
      if (order) whereSql += ` order by ${order[0]} ${order[1]}`;
      if (limit) whereSql += ` limit ${limit}`;
      if (offset) whereSql += ` offset ${offset}`;
      const totalCountStr = whereSqlStr(where, select, true);
      const total = await sqliteFindJob(totalCountStr);
      const data = await sqliteFindJob(whereSql);
      return { total: total[0].total, data };
    },
    // update更新语句
    update: async ({ where }, update) => {
      if (!where) throw 'missing where conditions';
      if (!update) throw 'missing update data';
      let sql = `update ${tableName} set `;
      const upKeys = Object.keys(update);
      const findKeys = Object.keys(where);
      const merdeData = Object.assign({}, update);
      if (useUpdatedAt) merdeData.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      const params = {};
      for (const i in merdeData) {
        const start = ` ${upKeys.indexOf(i) === 0 ? '' : ','} `;
        const val = `$_${i}`;
        sql += start + `${i} = ${val}`;
        params[val] = merdeData[i];
      }
      for (const i in where) {
        const start = ` ${findKeys.indexOf(i) === 0 ? 'where ' : 'and'} `;
        const val = `$${i}`;
        sql += start + `${i} ${where[i] === null ? 'is' : '='} ${val}`;
        params[val] = where[i];
      }

      return new Promise((reslove, reject) => {
        db.run(sql, params, (err, rows) => {
          if (err) {
            logger.error(err);
            return reject(err);
          }
          reslove(rows);
        });
      });
    },
    // 创建表
    asyncTable: async () => {
      if (!tableName) throw 'options.tableName is required';
      let sql = `CREATE TABLE ${tableName} ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, `;
      for (let i = 0; i < options.colums.length; i++) {
        const item = options.colums[i];
        let type = item.type === dbTypes.CHAR ?
          item.len ? (dbTypes.CHAR + `(${item.len})`) : (dbTypes.CHAR + '(50)') : item.type;
        if (item.default !== undefined && item.default !== null) {
          type += ` DEFAULT ${JSON.stringify(item.default)}`;
        }
        sql += `"${item.key}" ${type}${i === options.colums.length - 1 ? ')' : ','} `;
      }
      logger.info(sql);
      return new Promise((reslove) => {
        db.serialize(() => {
          db.run(sql, (err) => {
            if (err) {
              reslove();
              return logger.warn(` ❗ from ${tableName} exist.`);
            }
            logger.info(`✔️   from ${tableName} created...`);
            reslove();
          });
        });
      });
    },
    // 增加字段
    addColumn: async ({ key, type, defaultVal }) => {
      let sql = `ALTER TABLE ${tableName} ADD COLUMN ${key} ${type} `;
      if (defaultVal !== undefined && defaultVal !== null) {
        sql += `DEFAULT ${JSON.stringify(defaultVal)}`;
      }
      return new Promise((reslove) => {
        db.serialize(() => {
          db.run(sql, (err) => {
            if (err) {
              reslove();
              return logger.warn(` ❗  ${tableName} column ${key} exist.`);
            }
            logger.info(`✔️   add ${tableName} column: ${key} type: ${type}`);
            reslove();
          });
        });
      });
    },
    // 清空数据
    removeData: async () => {
      const sql = `DELETE FROM ${tableName} `;
      return new Promise((reslove) => {
        db.serialize(() => {
          db.run(sql, (err) => {
            if (err) {
              return reslove();
            }
            logger.info(`✔️  ${tableName} data is all removed`);
            reslove();
          });
        });
      });
    },
  };
};
const transactionManager = {
  transaction: async () => {
    return new Promise((res, rej) => {
      db.run('BEGIN TRANSACTION', (err, rows) => {
        if (err) { logger.error(err); return rej(err); }
        res(rows);
      });
    });
  },
  commit: async () => {
    return await new Promise((res, rej) => {
      db.run('END TRANSACTION', (err, rows) => {
        if (err) { logger.error(err); return rej(err); }
        res(rows);
      });
    });
  },
  rollback: async () => {
    return await new Promise((res, rej) => {
      db.run('ROLLBACK', (err, rows) => {
        if (err) { logger.error(err); return rej(err); }
        res(rows);
      });
    });
  },
};
module.exports = { db, defineModel, dbTypes, FindOptions, transactionManager };