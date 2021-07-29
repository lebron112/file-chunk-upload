import request from '../request';

export interface IFileUploadData {
  suffix: string;
  path: string;
  filename: string;
  key: string;
}
export const fileUploadv1 = (data: FormData) => {
  return request<IFileUploadData>({
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    url: '/file/upload/v1',
    data,
  });
};

export const checkFile = (params: { hash: string; index: number, ext:string }) => {
  return request<boolean>({
    method: 'get',
    url: '/file/check-exist',
    params,
  });
};

export const fileUploadV2 = (data: FormData) => {
  return request<boolean>({
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    url: '/file/upload/v2',
    data,
  });
};

export const getFileInfo = (hash: string, ext: string) => {
  return request<IFileUploadData>({
    method: 'get',
    url: '/file/info',
    params: { hash, ext }
  });
};

export const saveFile = (data: IFileUploadData & { theme?:string}) => {
  return request<null>({
    method: 'post',
    url: '/file',
    data
  });
};

export const getFiles = (params: { page: number; size: number }) => {
  return request<{ total: number; data: Array<IFileUploadData & { theme:string; id:number}> }>({
    method: 'get',
    url: '/file',
    params
  });
};
const api = {
  getFileInfo,
  checkFile,
  fileUploadv1,
  fileUploadV2,
  saveFile,
  getFiles,
};
export default api;
