const log4js = require('log4js');
log4js.configure(require('./log4js-config'));
const logger = log4js.getLogger('init');
const path = require('path');
const fs = require('fs');
const { Files, dbTypes } = require('./model');

const init = async () => {
  await Files.asyncTable();
  // await Files.addColumn({ key: 'theme', type: dbTypes.CHAR });
  try {
    fs.mkdirSync(path.join(process.cwd(), '/public'));
  } catch (e) { }
  logger.info('init success.');
};

init();