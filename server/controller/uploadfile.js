const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const log4js = require('log4js');
const logger = log4js.getLogger('upload-file');
const publicPath = '/public';
const temporaryPath = '/temporary';
const { Files, fileState } = require('../model');
const { writeSpeedStream, readSpeedStream, MB } = require('./speed-control');
const fse = require('fs-extra');

const chunkSize = 100;
class UploadfileController {

  getHashPath(hash, ext) {
    return path.join(process.cwd(), publicPath, `${hash}${ext ? ('.' + ext) : ''}`);
  }

  getTemporaryFilePath(hash, index) {
    const zero = '0'.repeat((chunkSize).toString().length - index.toString().length);
    index = `${zero}${index}`;
    return path.join(process.cwd(), publicPath, temporaryPath, hash, `${hash}_${index}`);
  }

  fileChunk(req) {
    const form = formidable({ multiples: true });
    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, formData) => {
        if (err) return reject(err);
        const file = formData.file;
        const index = fields.index;
        const hash = fields.hash;
        const ext = fields.ext;
        // console.log(file.size);
        const dir = path.join(process.cwd(), publicPath, temporaryPath, hash);
        // 先检查文件在不在
        const exist = fse.existsSync(this.getHashPath(hash, ext));
        if (exist) return resolve({ hash, ext, flag: true, dir });
        // 断点续传 检查碎片在不在
        const temporaryFilePath = this.getTemporaryFilePath(hash, index);
        const res = await this.checkFileExist(temporaryFilePath);
        if (res) return resolve({ hash, ext, dir });
        // 2种方式一种 限速，二是直接写入
        // 1、限速 创建文件流 
        const readStream = fs.createReadStream(file.path);
        const dirExist = fse.existsSync(dir);
        if (!dirExist) {
          fse.mkdirSync(dir);
        }
        await writeSpeedStream(temporaryFilePath, readStream, MB * 0.1);
        // 2、不限速 直接写入
        await fse.move(file.path, temporaryFilePath);
        resolve({ hash, ext, dir });
        // resolve({ hash, ext,dir });
      });
    });
  }

  async uploadChunk(req) {
    let d = Date.now();

    const { hash, ext, flag, dir } = await this.fileChunk(req);
    if (flag) return;
    // 检查是否已经100个了 到了100个就进行文件合并
    const hashPath = path.join(process.cwd(), publicPath, temporaryPath, hash);
    const exist = fse.existsSync(hashPath);

    if (exist) {
      let chunksPath = await fse.readdir(hashPath);
      chunksPath.filter(item => item.startsWith(hash))
        .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
      const newFilePath = this.getHashPath(hash, ext);
      if (chunksPath.length === chunkSize) {
        chunksPath = chunksPath.map(cp => path.resolve(hashPath, cp));
        await this.mergeFiles(chunksPath, newFilePath,);
        setTimeout(() => {
          fse.rmdir(dir);
        }, 1000);

      }
    }
  }

  async mergeFiles(files, file) {
    if (!fse.existsSync(file)) {
      // 文件合并
      let start = 0;
      return new Promise((res) => {
        files.map((item, index) => {
          const { size } = fse.statSync(item);
          // 此处亦需要限速读取
          const readStream = fs.createReadStream(item);
          const writeStream = fs.createWriteStream(file, {
            start,
          });
          start += size;
          readStream.on('end', () => {
            fse.unlinkSync(item);
            index === files.length - 1 && res();
          });
          readStream.pipe(writeStream);
        });
      });
    }
  }


  async fileInfo({ hash, ext }) {
    const exist = fse.existsSync(this.getHashPath(hash, ext));
    return {
      suffix: ext,
      path: publicPath,
      filename: hash,
      key: hash
    };
  }

  checkFileExist(path) {
    return new Promise((res, rej) => {
      fs.access(path, fs.constants.F_OK, (err) => {
        res(err ? false : true);
      });
    });
  }

  /** 检查碎片是否存在，如果文件已经上传过了，则d直接返回true， 否则查看 publicPath/temporary的文件下是否有对应hash_[索引]  */
  async checkExist({ hash, ext, index }) {
    const filePath = this.getHashPath(hash, ext);
    const exist = await this.checkFileExist(filePath);
    // const exist =  fse.existsSync(filePath);
    if (exist) {
      return true;
    } else {
      const temporaryFilePath = this.getTemporaryFilePath(hash, index);
      const res = await this.checkFileExist(temporaryFilePath);
      // const res = fse.existsSync(temporaryFilePath);
      return res;
    }
  }

}

const uploadfileController = new UploadfileController();

module.exports = uploadfileController;