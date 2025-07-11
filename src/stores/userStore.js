import { defineStore } from 'pinia'

export const useUserStore = defineStore({
  id: 'user',
  state: () => {
    // 尝试从localStorage初始化
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');

    return {
      token: token || null,
      username: username || null,
      email: email || null,
    }
  },
  getters: {
    isLoggedIn() {
      return this.token !== null;
    },
  },
  actions: {
    setToken(token) {
      this.token = token;
    },
    removeToken() {
      this.token = null;
    },
    setUsername(username) {
      this.username = username;
    },
    removeUsername() {
      this.username = null;
    },
    setEmail(email) {
      this.email = email;
    },
    removeEmail() {
      this.email = null;
    },
  }
})