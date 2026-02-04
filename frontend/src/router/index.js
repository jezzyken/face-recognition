import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/register',
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/FaceRegister.vue'),
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('../views/FaceVerify.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
