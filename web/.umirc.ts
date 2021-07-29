import routes from './src/routes';
import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes,
  fastRefresh: {},
  dynamicImport: {},
  cssModulesTypescriptLoader: { mode: 'emit' },
  devServer: {
    port: 10086,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      }
    }
  },
  mfsu: {},
});
