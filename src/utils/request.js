import axios from "axios";
import { useUserStore } from "../stores/userStore.js";

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 50000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 配置请求头和认证
    const token = localStorage.getItem('token');

    if (token) {
      // 确保token格式正确
      if (token.startsWith('Bearer ')) {
        config.headers.Authorization = token;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 调试信息
    console.log('请求URL:', config.baseURL + config.url);
    console.log('请求方法:', config.method);
    console.log('请求头:', config.headers);
    if (config.data) {
      console.log('请求数据:', typeof config.data === 'string' ? config.data : JSON.stringify(config.data));
    }

    return config;
  },
  (error) => {
    // 处理请求错误
    console.error("请求拦截器错误：", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response);

    let res = response.data;

    if (response.status === 200) {
      //如果返回的是文件
      if (response.config.responseType === "blob") {
        return res;
      }
      //兼容返回的字符串数据
      if (typeof res === "string") {
        res = res ? JSON.parse(res) : res;
      }
      return res;
    } else {
      console.error('响应状态码非200:', response.status);
      return Promise.reject(new Error('请求失败: ' + response.status));
    }
  },
  (error) => {
    // 处理响应错误
    console.error("响应拦截器错误：", error);

    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);

      // 如果是401未授权，可能是令牌过期或无效
      if (error.response.status === 401) {
        console.log('检测到401错误，需要重新登录');

        // 清除本地存储的令牌
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');

        // 使用userStore清除状态
        try {
          const userStore = useUserStore();
          userStore.removeToken();
          userStore.removeUsername();
          userStore.removeEmail();
        } catch (e) {
          console.error('清除用户状态失败:', e);
        }

        // 跳转到登录页面
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default service;
