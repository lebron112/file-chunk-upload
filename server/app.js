const Koa = require('koa');
// const config = require('./config');
const log4js = require('log4js');
log4js.configure(require('./log4js-config'));
const logger = log4js.getLogger('app');
const middlewares = require('./middlewares');
const path = require('path');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const route = require('./routes');
const app = new Koa();
app.use(async (ctx, next) => {
  if (/utf/i.test(ctx.request.headers['content-encoding'])) {
    delete ctx.request.headers['content-encoding'];
  }
  await next();
});
app.use(bodyParser());
app.use(middlewares.errorHandler);

// api路由层
app.use(route.routes(), route.allowedMethods());
const port = 9000;
app.listen(port);
logger.info(`serial port server runing at port ${port}.....`);