const log4js = require('log4js');
const logger = log4js.getLogger('handler');
const { PassThrough } = require('stream');
const fs = require('fs');


const MB = 1024 * 1024;

const printMemoryUsage = () => {
  const info = process.memoryUsage();
  function mb(v) {
    return (v / 1024 / 1024).toFixed(2) + 'MB';
  }
  logger.info('rss= %s, heapTotal= %s, heapUsed= %s',
    mb(info.rss),
    mb(info.heapTotal),//堆内存
    mb(info.heapUsed));
};

const getT = (t) => (Date.now() - t) / 1000;

// 并发最大速率
const maxSize = MB * 1;

/** 计算并发瞬时读取速度计算  */
const checkMaxSpeed = (maxSize) => {
  const speedObj = new Map();
  return {
    insetSpeedKey() {
      return Math.random().toString().slice(2, 8) + Date.now();
    },
    setSpeed(key, speed) {
      speedObj.set(key, speed);
    },
    checkTotalSpeed() {
      const arr = Array.from(speedObj.values());
      const isTooFast = arr.reduce((a, b) => a + b) > maxSize;
      // console.log('checkTotalSpeed',speedObj.values(),  arr.reduce((a, b) => a + b));
      return isTooFast;
    },
    removeItem(key) {
      return speedObj.delete(key);
    }
  };
};

const speedContrl = checkMaxSpeed(maxSize);

const speedStream = (stream, speed, readEnd = true) => {
  let readBytesSecond = 0;
  let lastTimestamp = Date.now();
  let tid = null;
  const key = speedContrl.insetSpeedKey();
  
  // 检查单文件瞬时和并发瞬时是否饱和
  const isTooFast = () => {
    const bps = readBytesSecond / getT(lastTimestamp);
    speedContrl.setSpeed(key, bps);
    return bps > speed  || speedContrl.checkTotalSpeed();
  };

  const checkSpeed = () => {
    // 读取速度大于 或者 瞬时资源占用超过一定数量
    if (isTooFast() ) {
      stream.pause();
      // 直到平均速度放缓到预设的值时继续读流
      tid = setInterval(() => {
        if (!isTooFast()) {
          clearInterval(tid);
          stream.resume();
        }
      }, 100);
    } else {
      stream.resume();
    }
  };

  let t = Date.now();
  // 只有 PassThrough 可以使用 其他流在响应后都能不能再写入
  const newStream = new PassThrough();
  stream.on('data', (chunk) => {
    readBytesSecond += chunk.length;
    const speed = readBytesSecond /(1024 * 1024)/ getT(t);
    // logger.info('readBytes %s speed: %sMB/S', readBytesSecond, speed.toFixed(2));
    speedContrl.setSpeed(key);
    checkSpeed();
    newStream.write(chunk);
    // printMemoryUsage();
  });


  stream.on('end', () => {
    speedContrl.removeItem(key);
    logger.info(`read file use: ${Date.now() - t}ms`);
    clearInterval(tid);
    newStream.end();
  });
  return newStream;
};

exports.readSpeedStream = (stream, speed) => {
  return speedStream(stream, speed);
};
// 最大上传速度
const maxWriteSpeed = MB * 0.01;
exports.writeSpeedStream = (path, stream, readSpeed) => {
  return new Promise((res, rej) => {
    const buf = [];
    const newStream = speedStream(stream, readSpeed, maxWriteSpeed, false);
    newStream.on('data', (chunks) => {
      buf.push(chunks);
    });
    newStream.on('error', (err) => {
      rej(err);
    });
    newStream.on('end', () => {
      fs.writeFile(path, Buffer.concat(buf), (err) => {
        if (err) {
          rej(err);
        }
        res();
      });
    });
  });
};
exports.MB = MB;