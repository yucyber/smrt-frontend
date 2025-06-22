import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from '../stores/userStore.js';
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashBoard from "../views/DashBoard.vue";
import EditView from "../views/EditView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: HomeView,
    },
    {
      path: "/login",
      component: LoginView,
    },
    {
      path: "/register",
      component: RegisterView,
    },
    {
      path: "/edit/:id",
      name: "edit",
      component: EditView,
      meta: { requiresAuth: true },
    },
    {
      path: "/dashboard",
      component: DashBoard,
      meta: { requiresAuth: true },
      children: [
        {
          path: "/",
          redirect: "/dashboard/DocumentPage",
        },
        {
          path: "DocumentPage",
          component: () => import("../components/DocumentPage.vue"),
        },
        {
          path: "TemplateRepo",
          component: () => import("../components/TemplateRepo.vue"),
        },
        {
          path: "MyTemplate",
          component: () => import("../components/MyTemplate.vue"),
        },
        {
          path: "StarPage",
          component: () => import("../components/StarPage.vue"),
        },
        {
          path: "RecyclePage",
          component: () => import("../components/RecyclePage.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  console.log('路由守卫检查:', to.path);

  // 将开发模式设置为false，启用正常的身份验证
  const devMode = false;

  // 如果是登录页或注册页，直接通过
  if (to.path === '/login' || to.path === '/register') {
    next();
    return;
  }

  // 对需要认证的页面进行检查
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');

    if (token || devMode) {
      console.log('身份验证通过或开发模式，允许访问:', to.path);

      // 刷新Pinia存储，确保状态一致
      if (token) {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');

        try {
          const userStore = useUserStore();
          userStore.setToken(token);
          userStore.setUsername(username || '测试用户');
          userStore.setEmail(email || 'test@example.com');
        } catch (e) {
          console.error('更新用户状态失败:', e);
        }
      }

      next();
    } else {
      console.log('身份验证失败，重定向到登录页');
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  } else {
    next();
  }
});

export default router;
