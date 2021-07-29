import themeColor from './themeColor';

export const getArrayBuffer = (blob: Blob | File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = error => reject(error);
  });
};

export const getBase64 = (blob: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = error => reject(error);
  });
};

export const mergeArrayBuffer = (arrays: ArrayBuffer[]): ArrayBuffer => {
  let totalLen = 0;
  const copyArrays: Uint8Array[] = [];
  for (let i = 0; i < arrays.length; i++) {
    copyArrays[i] = new Uint8Array(arrays[i]);
    totalLen += arrays[i].byteLength;
  }
  const res = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of copyArrays) {
    res.set(arr, offset);
    offset += arr.byteLength;
  }
  return res;
};

type TChunkItem = { index: number, file: Blob };
export const splitFile = async (file: File, splitNumber: number): Promise<Array<TChunkItem>> => {
  const blobSlize = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  const len = file.size;
  // 文件切片
  const chunkSize = Math.ceil(len / splitNumber);
  const chunks: TChunkItem[] = [];
  for (let i = 0; i < splitNumber; i++) {
    const end = chunkSize * (i + 1);
    const next = end > len ? len : end;
    const splitedFile = blobSlize.call(file, chunkSize * i, next);
    const arrBuf = await getArrayBuffer(splitedFile);
    const chunkFile = new Blob([arrBuf]);
    chunks.push({
      index: i,
      file: chunkFile,
      // file: splitedFile,
    });
  }
  return chunks;
};
export type TColor = [number, number, number];
export const getColor = (src: string): Promise<TColor[]> => {
  return new Promise(async (res) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = src;
    img.onload = () => {
      themeColor(img, (data: TColor[]) => {
        res(data);
      });
    };
  });

};