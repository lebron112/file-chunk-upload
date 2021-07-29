const log4js = require('log4js');
const logger = log4js.getLogger('handler');

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    let { status = 500, message } = error;
    if (error.name === 'AppError') {
      ctx.body = { code: status, message: '服务器异常' };
    } else if (error.name === 'JsonError') {
      ctx.body = { code: status, message };
    } else {
      const METHOD = ctx.method;
      let content = `${METHOD} ${ctx.url} [${error.name}] message: ${message} status: ${status} `;
      content += `\nheader: ${JSON.stringify(ctx.request.header)}`;
      if (METHOD === 'POST' || METHOD === 'PUT') {
        content += `\nbody: ${JSON.stringify(ctx.request.body)}`;
      }
      if (error.status < 500) {
        logger.debug(content);
      } else {
        message = '服务器异常';
        logger.error(`${content}\n${error.stack}`);
      }
      ctx.body = { code: status, message };
    }
  }
};
