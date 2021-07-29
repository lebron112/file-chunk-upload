const Router = require('koa-router');
const router = new Router();
const staticController = require('../controller');
const uploadControll = require('../controller/uploadfile');

router.post('/api/file/upload/v1', (ctx) => {
  staticController.uploadStatic(ctx);
});
// 切片上传的接口
router.post('/api/file/upload/v2', async (ctx) => {
  await uploadControll.uploadChunk(ctx.req);
  // await new Promise((res) => setTimeout(res, Math.random() * 200));
  ctx.body = { code: 200, data: true };
});
// 检查碎片
router.get('/api/file/check-exist', async (ctx) => {
  const { hash, ext, index } = ctx.query;
  const data = await uploadControll.checkExist({ hash, ext, index });
  ctx.body = { code: 200, data };
});
// 获取整合后的文件信息
router.get('/api/file/info', async (ctx) => {
  const { hash, ext } = ctx.query;
  const data = await uploadControll.fileInfo({ hash, ext });
  ctx.body = { code: 200, data };
});

router.post('/api/file', async (ctx) => {
  const { key, path, suffix, filename, theme } = ctx.request.body;
  await staticController.resolveBusniess({ key, path, suffix, filename, theme });
  ctx.body = { code: 200 };

});

router.get('/api/file', async (ctx) => {
  const data = await staticController.getAllFiles(ctx.query);
  ctx.body = { code: 200, data };
});

router.get('/public/:id', async (ctx) => {
  const { id } = ctx.params;
  const res = await staticController.getStaticSource(id);
  ctx.body = res;
});
module.exports = router;