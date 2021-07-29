import api, { IFileUploadData } from '@/services/api';
import { Col, Row, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { useState, useEffect, useRef } from 'react';
import styles from './index.less';

const { Column } = Table;

/** 带类型的colum  */
export function bindColumn<T extends { [key: string]: any }>() {
  return (props: Omit<ColumnProps<T>, 'key'> & { dataIndex: keyof T }) => {
    const dataIndex: keyof T = props.dataIndex as string;
    const columnProps = {
      ...props,
      dataIndex: dataIndex as string | number | (string | number)[] | undefined,
      key: dataIndex as string | number | undefined,
    };
    if (props.render) {
      columnProps.render = (value: any, record: T, index: number) => {
        return props.render && props.render(value, record, index);
      };
    }
    return Column(columnProps);
  };
}
type IDataItem = IFileUploadData & { id: number; theme: string; };
const FileColum = bindColumn<IDataItem>();

const LoadImg = (props: { src: string, theme: string }) => {
  const { src } = props;
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<null | HTMLDivElement>(null);
  const img = new Image();
  useEffect(() => {
    img.src = props.src;
    img.setAttribute('width', '300px');
    img.setAttribute('height', '300px');
    img.onload = () => {
      setLoaded(true);
      ref.current && ref.current.appendChild(img);
    };
  }, [src]);

  return <div style={{ width: 300, height: 300 }} ref={ref}>
    {
      loaded ? ''
        : <div
          style={{ width: 300, height: 300, display: 'inline-block', background: props.theme }}
        />
    }
  </div>;
};
const ImageListPage = () => {
  const [data, setData] = useState<Array<IDataItem>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  useEffect(() => {
    mounted();
  }, []);

  const mounted = async () => {
    const data = await api.getFiles({ page, size: 100 });
    console.log(data);
    setData(data.data);
    setTotal(data.total);
  };

  return (
    <div style={{ padding: 20 }}>
      <div>图片列表页面</div>
      <Row>
        {
          data.map(item => {
            const { path, id, theme } = item;
            return (
              <Col span={6} key={id}>
                <div style={{ padding: 10 }}>
                  <LoadImg key={id} src={`${path}/${id}`} theme={theme} />
                </div></Col>
            );
          })
        }
      </Row>
    </div>
  );
};
export default ImageListPage;
