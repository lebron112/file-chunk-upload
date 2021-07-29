const { dbTypes, defineModel } = require('./db');
/** 状态  */
const fileState = {
  delete: 0,
  active: 1
};
/** 附件 */
const Files = defineModel({
  tableName: 't_file',
  colums: [
    { key: 'path', type: dbTypes.CHAR, commit: '位置信息' },
    { key: 'filename', type: dbTypes.CHAR, commit: '文件描述' },
    { key: 'key', type: dbTypes.CHAR, commit: '文件名' },
    { key: 'suffix', type: dbTypes.CHAR, length: 10, commit: '文件后缀名', },
    { key: 'state', type: dbTypes.INT, commit: '状态0删除 1有效', default: fileState.active },
    { key: 'theme', type: dbTypes.CHAR, length: 10, commit: '主色调', },
    { key: 'createdAt', type: dbTypes.TEXT },
    { key: 'updatedAt', type: dbTypes.TEXT },
  ],
});

module.exports = {
  Files,
  fileState,
};