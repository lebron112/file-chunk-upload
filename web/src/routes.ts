const routes = [
  {
    path: '/',
    redirect: '/upload',
  },
  {
    path: '/upload',
    component: '@/pages/upload',
  },
  {
    path: '/upload-v1.1',
    component: '@/pages/uploadv1.1',
  },
  {
    path: '/list',
    component: '@/pages/list',
  }
];

export default routes;