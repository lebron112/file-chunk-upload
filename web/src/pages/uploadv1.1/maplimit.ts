
type AsynFun = () => Promise<any>;

export default function <T>(arrFn: Array<AsynFun>, limit: number) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(arrFn)) {
      reject(null);
    }
    let doing = 0;
    const result: Array<T> = [];
    let count = 0;
    let index = 0;
    const checkFn = () => {
      while (doing < limit && index < arrFn.length) {
        doing++;
        const i = index;
        Promise.resolve(arrFn[index]()).then(data => {
          doing--;
          count++;
          result[i] = data;
          checkFn();
          if (count === arrFn.length) {
            resolve(result);
          }
        }).catch(err => {
          reject(err);
        });
        index++;
      }
    };
    checkFn();
  });
}
