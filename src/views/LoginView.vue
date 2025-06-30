<template>
  <div class="container">
    <div class="login">
      <div class="image">
        <img style="width: 10vw;" alt="logo" src="../assets/images/white_bg_logo.png" />
      </div>
      <p class="logo">妙笔</p>
      <div class="login-info">
        默认测试账号: test@example.com<br>
        默认测试密码: 123456
      </div>
      <div v-if="serverStatus === 'checking'" class="server-status checking">
        正在检查服务器状态...
      </div>
      <div v-else-if="serverStatus === 'online'" class="server-status online">
        服务器状态: 在线 ✓
      </div>
      <div v-else-if="serverStatus === 'offline'" class="server-status offline">
        服务器状态: 离线 ✗<br>
        <small>请确保后端服务已启动</small>
      </div>
      <el-form class="form" :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="email">
          <el-input v-model="loginForm.email" autocomplete="off" placeholder="邮箱"><template #prepend>
              <el-icon>
                <Message />
              </el-icon> </template></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input type="password" v-model="loginForm.password" autocomplete="off" show-password
            placeholder="密码"><template #prepend>
              <el-icon>
                <Lock />
              </el-icon> </template></el-input>
        </el-form-item>
      </el-form>
      <el-button type="primary" plain :icon="Pointer" class="varify" @click="onShow"
        v-if="!isSuccess">点击按钮进行验证</el-button>
      <el-button type="success" plain :icon="CircleCheck" class="varify" v-if="isSuccess">验证成功</el-button>
      <Vcode :show="isShow" @success="onSuccess" @close="onClose" />
      <div class="buttons">
        <el-button type="default" @click="cancel">取消</el-button>
        <el-button type="primary" @click="login">登录</el-button>
      </div>
      <el-button type="success" class="dev-login" @click="devLogin">快速开发登录</el-button>
      <p class="register" @click="goRegist">没有账户？立即注册</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { buttonEmits, ElLoading, ElMessage } from "element-plus";
import { Pointer, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore.js';
import Vcode from "vue3-puzzle-vcode";
import request from "../utils/request.js";
import router from "../router";

const userStore = useUserStore();
const loginFormRef = ref();
const isShow = ref(false);
const isSuccess = ref(true);
const serverStatus = ref('checking');

const loginForm = reactive({
  email: "",
  password: "",
});
const rules = reactive({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度必须在6到20个字符之间', trigger: 'blur' },
  ],
});

const login = async () => {
  const valid = await loginFormRef.value.validate();
  if (!valid) return;

  try {
    const loadingInstance = ElLoading.service({
      fullscreen: true,
      text: "正在登录...",
    });

    // 使用正常的API请求进行登录
    console.log("发送登录请求:", loginForm);

    // 创建一个完整的请求对象，确保数据格式正确
    const requestData = {
      email: loginForm.email,
      password: loginForm.password
    };

    console.log('登录请求数据:', JSON.stringify(requestData));

    try {
      // 尝试使用原生fetch API，避免可能的axios拦截器问题
      const fetchResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('原生fetch响应状态:', fetchResponse.status);

      const responseData = await fetchResponse.json();
      console.log('原生fetch响应数据:', responseData);

      if (responseData.code == 200) {
        // 存储token和用户信息
        localStorage.setItem('token', responseData.data.access_token);
        localStorage.setItem('username', responseData.data.username);
        localStorage.setItem('email', loginForm.email);

        // 更新pinia store
        userStore.setToken(responseData.data.access_token);
        userStore.setUsername(responseData.data.username);
        userStore.setEmail(loginForm.email);

        // 提示成功并跳转
        ElMessage.success('登录成功');
        router.push('/dashboard/KnowledgeBasePage');
        loadingInstance.close();
        return;
      } else {
        console.error('登录失败:', responseData.message);
        ElMessage.error(responseData.message || '登录失败，请检查用户名和密码');
        loadingInstance.close();
        return;
      }
    } catch (fetchError) {
      console.error('原生fetch请求错误:', fetchError);
      // 继续尝试axios请求
    }

    // 使用axios作为备选方案
    const response = await request.post('/auth/login', requestData);

    console.log('axios登录响应:', response);

    if (response && response.code == 200) {
      // 存储token和用户信息
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', loginForm.email);

      // 更新pinia store
      userStore.setToken(response.data.access_token);
      userStore.setUsername(response.data.username);
      userStore.setEmail(loginForm.email);

      // 提示成功并跳转
      ElMessage.success('登录成功');
      router.push('/dashboard/KnowledgeBasePage');
    } else {
      ElMessage.error(response?.message || '登录失败，请检查用户名和密码');
    }

    loadingInstance.close();
  } catch (error) {
    console.error('登录错误:', error);
    ElMessage.error(error.message || '登录失败，请稍后再试');
  }
};

const cancel = () => {
  router.push("/");
};

const onShow = () => {
  isShow.value = true;
};

const onClose = () => {
  isShow.value = false;
};

const onSuccess = () => {
  isSuccess.value = true;
  onClose();
};

const goRegist = () => {
  router.push("/register");
};

const devLogin = () => {
  console.log("使用开发模式快速登录");

  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在以开发模式登录...",
  });

  const requestData = {
    email: 'test@example.com',
    password: '123456'
  };

  console.log('开发模式登录请求数据:', JSON.stringify(requestData));

  // 直接使用原生fetch API
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      console.log('开发模式登录状态码:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('开发模式登录响应:', data);

      if (data && data.code == 200) {
        // 存储token和用户信息
        localStorage.setItem('token', data.data.access_token);
        localStorage.setItem('username', data.data.username);
        localStorage.setItem('email', 'test@example.com');

        // 更新pinia store
        userStore.setToken(data.data.access_token);
        userStore.setUsername('开发测试用户');
        userStore.setEmail('dev@example.com');

        // 提示成功并跳转
        ElMessage.success('开发模式登录成功');
        router.push('/dashboard/KnowledgeBasePage');
      } else {
        // 登录失败
        ElMessage.error(data?.message || '开发模式登录失败，请检查后端服务');
      }
    })
    .catch(error => {
      console.error('开发登录错误:', error);
      ElMessage.error('开发模式登录失败: ' + error.message);
    })
    .finally(() => {
      loadingInstance.close();
    });
};

// 检查服务器状态
const checkServerStatus = async () => {
  try {
    serverStatus.value = 'checking';
    const response = await fetch('/api', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'no-cors'
    });

    console.log('服务器状态检查响应:', response.status);

    if (response.status >= 200 && response.status < 300) {
      serverStatus.value = 'online';
      console.log('服务器在线');
    } else {
      serverStatus.value = 'offline';
      console.log('服务器离线 - 状态码:', response.status);
    }
  } catch (error) {
    console.error('服务器状态检查失败:', error);
    serverStatus.value = 'offline';
  }
};

// 在组件挂载后检查服务器状态
onMounted(() => {
  checkServerStatus();
});

</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 80vh;
  width: 24vw;
  box-shadow: 0px 0px 1vh rgba(0, 0, 0, 0.3);
  border-radius: 1vw;
  background-color: #fff;
}

.image {
  display: flex;
  justify-content: center;
  margin-top: 2vh;
}

.logo {
  margin: 1vh auto;
  font-weight: bold;
  background: linear-gradient(135deg, #5DAEFF, #bd34fe);
  background-clip: text;
  color: transparent;
  font-size: 6vh;
}

.form {
  width: 20vw;
}

.code-container {
  display: flex;
}

.varify {
  width: 20vw;
  height: 5vh;
  margin-bottom: 2vh;
  font-size: 2vh;
}

.buttons .el-button {
  height: 4vh;
  width: 6vw;
  font-size: 2vh;
}

.register {
  margin-top: 2vh;
  font-size: 2vh;
  line-height: 2vh;
  color: var(--theme--color);
  cursor: pointer;
  display: inline-block;
}

.register:hover {
  color: var(--el-color-primary-dark-2);
}

.login-info {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

.dev-login {
  width: 20vw;
  margin-top: 1vh;
  font-size: 2vh;
}

.server-status {
  margin-bottom: 15px;
  padding: 8px;
  border-radius: 5px;
  text-align: center;
  font-size: 14px;
}

.server-status.checking {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.server-status.online {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.server-status.offline {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}
</style>
