import api from '@/services/api';
import { Button } from 'antd';
import React, { useRef, useState } from 'react';
import { IRouteComponentProps } from 'umi';
import styles from './styles.less';

const UploadPage = (props: IRouteComponentProps) => {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<null | File>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      fileRef.current = file;
    }
  };

  const onClick = async () => {
    const data = new FormData();
    if (fileRef.current) {
      data.append('file', fileRef.current);
      const res = await api.fileUploadv1(data);
      await api.saveFile(res);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>上传页面v1.0</h3>
      <div>
        <input type='file' onChange={onChange} />
      </div>
      <div style={{ paddingTop: 20 }}>
        <Button type='primary' loading={loading} onClick={onClick}>上传</Button>
      </div>

      <div style={{ paddingTop: 20 }}>
        <Button onClick={()=> window.open('/list') }>列表</Button>
        <Button onClick={()=> window.open('/upload-v1.1') }>上传1.1</Button>
      </div>
    </div>
  );
};

export default UploadPage;
