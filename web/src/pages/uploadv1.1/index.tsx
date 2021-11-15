
import api from '@/services/api';
import { Button, message, Modal } from 'antd';
import React, { useRef, useState } from 'react';
import SparkMD5 from 'spark-md5';
import { getArrayBuffer, getBase64, getColor, splitFile, TColor } from './fileChunk';
import exifJs from 'exif-js';
import maplimit from './maplimit';

/** 获取文件的md5值  */
type TChunkItem = { index: number, file: Blob };
type TCheckMD5Res = {
  hash: string;
  name: string;
  type: string;
  chunks: TChunkItem[],
  src: string;
};

const loadImgExifInfo = (arrayData: ArrayBuffer) => {
  const exifRes = exifJs.readFromBinaryFile(arrayData);
  if (exifRes) {
    // delete exifRes.MakerNote;
    if (exifRes.GPSLatitude) {
      const [a, b, c] = exifRes.GPSLatitude;
      exifRes.GPSLatPosition = a + (b + c / 60) / 60;
    }
    if (exifRes.GPSLongitude) {
      const [a, b, c] = exifRes.GPSLongitude;
      exifRes.GPSLongPosition = a + (b + c / 60) / 60;
    }
    Modal.info({
      width: 1024,
      title: 'Exif info',
      content: (<div style={{ maxHeight: 600, overflow: 'auto' }}>
        <pre>{JSON.stringify(exifRes, null, 2)}</pre>
      </div>)
    });
  }
};

// web worker
const checkMD5 = async (file: File, splitNumber: number):
  Promise<TCheckMD5Res> => Promise.resolve().then(async () => {
    const type = file.name.split('.').pop() || '';
    const arrayData = await getArrayBuffer(file);
    loadImgExifInfo(arrayData);

    const chunks = await splitFile(file, splitNumber);
    const hash = new SparkMD5.ArrayBuffer().append(arrayData).end();
    console.log(hash);

    // 对arraybuffer进行合并
    const res = new Uint8Array(arrayData.byteLength);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      const { file } = chunks[i];
      const af = await getArrayBuffer(file);
      const bf = new Uint8Array(af);
      res.set(bf, offset);
      offset += af.byteLength;
    }
    // console.log(arrayData);
    // console.log(res);
    const hash2 = new SparkMD5.ArrayBuffer().append(res).end();
    console.log(hash2);
    // 直接将流转成文件
    const blob = new Blob([res]);
    const src = await getBase64(blob);
    // console.log(src);
    return {
      hash, type,
      chunks,
      name: file.name,
      src,
    };
  });

const UploadPageV2 = () => {
  const [loading, setLoading] = useState(false);
  const [pre, setPre] = useState(0);
  const uploadDataRef = useRef<null | TCheckMD5Res>(null);
  const [src, setSrc] = useState('');
  const [colors, setColors] = useState<TColor[]>([]);
  const [selCol, setSelColor] = useState('');

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setSelColor('');
    setColors([]);
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const data = uploadDataRef.current = await checkMD5(file, 100);

      setSrc(data.src);
      const color = await getColor(data.src);
      setColors(color);
    }

  };

  const onClick = async () => {

    if (!selCol) return message.warn('请选择一个主题色');
    setLoading(true);
    const uploadData = uploadDataRef.current;
    let i = 0;
    if (uploadData) {
      const { hash, chunks, type, name } = uploadData;
      const execJobs = chunks.map(item => {
        return async () => {
          console.log(i);
          i++;
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('index', item.index.toString());
          formData.append('hash', hash);
          formData.append('ext', type);
          const res = await api.fileUploadV2(formData);
          if (res) setPre((v) => v + 1);
          i--;
        };
      });
      const d = Date.now();
      // 并发控制执行的函数 
      await maplimit(execJobs, 10);
      // for(const item of execJobs) {
      //   await item();
      // }
      console.log(Date.now() - d);
      const res = await api.getFileInfo(hash, type);
      await api.saveFile({ ...res, filename: name, theme: selCol });
      setLoading(false);
      setPre(0);
    }
  };

  return <div style={{ padding: 20 }}>
    <Button onClick={() => window.open('/list')}>列表</Button>
    <h3>上传页面v1.1</h3>
    <div>
      <input type='file' onChange={onChange} />
    </div>
    <div style={{ paddingTop: 20 }}>
      <Button type='primary' loading={loading} onClick={onClick}>上传</Button>
    </div>
    <div>上传进度：{pre} % </div>
    <img src={src} width='500px' />
    <div>
      {colors.length ? <div>选择一个主题色</div> : ''}
      {
        colors.map(item => {
          const [r, g, b] = item;
          const background = `rgba(${r},${g},${b})`;
          return (
            <div
              key={background}
              style={{
                width: 100,
                height: 100,
                background,
                display: 'inline-block',
                marginLeft: 10,
                border: '2px solid',
                borderColor: selCol === background ? 'red' : '#fff'
              }}
              onClick={() => setSelColor(background)}
            />
          );
        })
      }
    </div>
  </div>;
};

export default UploadPageV2;