const service = require('../service');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const log4js = require('log4js');
const logger = log4js.getLogger('easy-upload');
const publicPath = '/public';
const PassThrough = require('stream').PassThrough;
const { Files } = require('../model');
const { readSpeedStream, MB } = require('./speed-control');



class StaticController {
  async uploadStatic(ctx) {
    const form = formidable({ multiples: true });
    const data = await new Promise((resolve, reject) => {
      form.parse(ctx.req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        // console.log(files);
        const file = files.file;
        const filename = file.name.split('.');
        let suffix = filename[1];
        if (!suffix) {
          suffix = file.type.split('/')[1];
        }
        const name = filename[0];
        if (!suffix) return { code: 400, message: '文件类型错误' };
        const keyName = Date.now();
        // 创建读取文件流
        const readStream = fs.createReadStream(file.path);
        if (!fs.existsSync(publicPath)) {
          fs.mkdirSync(publicPath);
        }
        // 创建写入文件流
        const writeStream = fs.createWriteStream(path.join(process.cwd(), publicPath, `./${keyName}.${suffix}`));
        readStream.pipe(writeStream);
        readStream.on('end', () => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            logger.error(error);
          }

          resolve({ suffix, path: 'public', key: keyName + '', filename: name });
        });
      });
    });
    ctx.body = { code: 200, data };
  }

  async getStaticSource(id) {
    const file = await Files.findOne({ where: { id } });
    if (!file) {
      // throw new 
    }
    const { key, suffix } = file;
    const filePath = path.join(process.cwd(), publicPath, `./${key}.${suffix}`);
    const readStream = fs.createReadStream(filePath);
    // 控制流的读取速度 实现限速下载 500kb/s
    const stream = readSpeedStream(readStream, MB * 0.5);
    // ctx.set('Content-Type', 'application/octet-stream');
    // ctx.body = stream;
    return stream;
  }

  async resolveBusniess({ key, path, suffix, filename, theme = '' }) {
    await Files.create({ key, path, suffix, filename, theme });
  }


  async getAllFiles(query) {
    const { page, limit } = query;
    const res = await Files.findAndCount({
      where: { state: 1 },
      select: ['path', 'filename', 'key', 'suffix', 'id', 'theme'],
      limit,
      offset: (page - 1) * limit,
    });
    return res;
  }
}

const staticController = new StaticController();
module.exports = staticController;