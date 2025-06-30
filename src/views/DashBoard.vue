<template>
  <el-container style="height: 100vh">
    <el-aside width="14vw" style="background-color: var(--nav--color)">
      <div class="platform">
        <img class="platform-logo" src="@/assets/images/logo.png" alt="logo" />
        <div class="platform-title">妙 笔</div>
      </div>
      <div class="add-container">
        <button class="add" @click="createDoc()"><i class="ri-add-line"></i>&nbsp;新建文档</button>
        <button class="import" @click="importDoc()"><i class="ri-import-line"></i>&nbsp;导入文档</button>
        <input type="file" ref="fileInput" accept=".docx" @change="handleFileChange" style="display: none;">
      </div>

      <el-divider class="divider-title">知识库</el-divider>

      <!-- 知识库目录树 -->
      <div class="knowledge-tree">
        <h4><i class="ri-folder-tree-line"></i>&nbsp;目录树</h4>
        <el-tree :data="knowledgeData" :props="defaultProps" @node-click="handleNodeClick" :default-expand-all="true"
          :highlight-current="true">
        </el-tree>
      </div>

      <!-- 最近访问列表 -->
      <div class="recent-access">
        <h4><i class="ri-time-line"></i>&nbsp;最近访问</h4>
        <ul class="recent-list" v-if="displayedRecentDocs.length > 0">
          <li v-for="(doc, index) in displayedRecentDocs" :key="index" @click="openDocument(doc.id)">
            <i class="ri-file-text-line"></i>&nbsp;{{ doc.title }}
            <span class="access-time">{{ doc.accessTime }}</span>
          </li>
          <li v-if="recentAccessDocs.length > 3 && !showAllRecent" class="show-more" @click.stop="toggleShowAllRecent">
            <i class="ri-more-line"></i>&nbsp;查看更多
          </li>
          <li v-if="showAllRecent && recentAccessDocs.length > 3" class="show-more" @click.stop="toggleShowAllRecent">
            <i class="ri-arrow-up-s-line"></i>&nbsp;收起
          </li>
        </ul>
        <div v-else class="empty-recent">
          <span>暂无最近访问记录</span>
        </div>
      </div>

      <!-- 主要功能链接 -->
      <div class="router-link">
        <router-link to="/dashboard/KnowledgeBasePage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-book-2-line"></i>
          &nbsp;&nbsp;
          全部知识库
        </router-link>
        <router-link to="/dashboard/DocumentPage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-file-list-line"></i>
          &nbsp;&nbsp;
          全部文档
        </router-link>
        <router-link to="/dashboard/StarPage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-star-line"></i>
          &nbsp;&nbsp;
          我的收藏
        </router-link>
        <router-link to="/dashboard/RecyclePage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-delete-bin-line"></i>
          &nbsp;&nbsp;
          回收站
        </router-link>
        <div class="more" @click="getMore()">更多</div>
        <el-dialog v-model="RightsDialog" title="权益对比">
          <el-table :data="tableData" :header-cell-style="setHeader" :cell-style="setCell">
            <el-table-column prop="Type" label="权益类型"></el-table-column>
            <el-table-column prop="super" label="超级会员"></el-table-column>
            <el-table-column prop="gold" label="黄金会员"></el-table-column>
            <el-table-column prop="normal" label="普通会员"></el-table-column>
          </el-table>
        </el-dialog>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">
        <a href="https://github.com/electronic-pig/SmartEditor" target="_blank" style="text-decoration: none; ">
          <i style="font-size: 4vh; color: #555" class="ri-github-fill"></i>
        </a>
        <el-autocomplete v-model="search" :fetch-suggestions="querySearchAsync" :trigger-on-focus="false"
          value-key="title" @select="handleSelect" placeholder="通过文档名搜索文档" clearable
          style="width: 40vw;margin-left: 15vw">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-autocomplete>
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" size="small"
          style="margin-left: 15vw" />
        <el-dropdown size="large" trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            {{ userStore.username }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="reset_password">
                <el-icon>
                  <EditPen />
                </el-icon>修改密码</el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon>
                  <SwitchButton />
                </el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        <ResetPassword :signal="toggle" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import router from "../router";
import { useRoute } from "vue-router";
import { useUserStore } from "../stores/userStore.js";
import { useKnowledgeBaseStore } from "../stores/knowledgeBaseStore.js";
import ResetPassword from "../components/ResetPassword.vue";
import request from "../utils/request.js";
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import mammoth from 'mammoth';
import axios from 'axios';

const userStore = useUserStore();
const knowledgeBaseStore = useKnowledgeBaseStore();
const route = useRoute(); // 获取当前路由
const toggle = ref(false);  // 控制重置密码对话框的显示
const RightsDialog = ref(false);  // 控制权益对比表格的显示
let search = ref('');
const fileInput = ref(null);
const tableData = ref([
  { Type: '存储空间', super: '10G', gold: '1G', normal: '100M' },
  { Type: '文档数量', super: '无限制', gold: '1000', normal: '100' },
  { Type: '个人模板', super: '无限制', gold: '100', normal: '10' },
  { Type: '下载打印', super: '支持', gold: '支持', normal: '无' },
  { Type: '信息提取', super: '全功能', gold: '部分功能', normal: '无' },
  { Type: 'AI编辑', super: '全功能', gold: '部分功能', normal: '无' },
  { Type: '模板库', super: '全部', gold: '部分', normal: '无' },
  { Type: '价格', super: '￥99/年', gold: '￥49/年', normal: 'Free' },
  { Type: '退款', super: '无理由退款', gold: '无理由退款', normal: '无理由退款' },
  { Type: '客服', super: '7*24小时', gold: '7*24小时', normal: '7*24小时' },
]);

// 知识库数据 - 从store获取
const knowledgeBases = computed(() => knowledgeBaseStore.getKnowledgeBases);
const recentAccessDocs = computed(() => knowledgeBaseStore.getRecentAccessDocs);

// 处理知识库数据，构建目录树
const knowledgeData = computed(() => {
  return [
    {
      label: '我的知识库',
      children: knowledgeBases.value.map(kb => ({
        label: kb.name,
        id: kb.id,
        icon: kb.icon
      }))
    },
    {
      label: '我的文档',
      children: [
        { label: '最近文档', id: 'recent' },
        { label: '重要文档', id: 'important' }
      ]
    }
  ];
});

const defaultProps = {
  children: 'children',
  label: 'label'
};

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.removeToken();
    userStore.removeUsername();
    userStore.removeEmail();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    router.push("/");
  }
  if (command === "reset_password") {
    toggle.value = !toggle.value;
  }
};
// 文档查询
const querySearchAsync = async (queryString, cb) => {
  try {
    const response = await request.get("/document/search/" + queryString);
    if (response.code == 200) {
      cb(response.documents);
    } else {
      cb([]);
      ElMessage.info(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  }
};
// 安全地记录文档访问的辅助函数
const safeRecordAccess = (docId, title) => {
  try {
    if (typeof knowledgeBaseStore.recordDocumentAccess === 'function') {
      console.log(`安全记录文档访问: ID=${docId}, 标题=${title}`);
      return knowledgeBaseStore.recordDocumentAccess(docId, title)
        .catch(err => {
          console.error('记录文档访问失败:', err);
          return Promise.resolve(false);
        });
    } else {
      console.error('recordDocumentAccess方法不存在');
      return Promise.resolve(false);
    }
  } catch (error) {
    console.error('记录文档访问出错:', error);
    return Promise.resolve(false);
  }
};
// 点击查询结果
const handleSelect = (item) => {
  // 记录访问
  safeRecordAccess(item.id, item.title);
  router.push({ name: 'edit', params: { id: item.id } });
};
// 新建文档
const createDoc = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在新建文档...",
  });

  try {
    // 确保发送的是一个普通的JavaScript对象
    const documentData = {
      title: "未命名文档",
      content: "<h1>未命名文档</h1><p>这是一个新文档</p>"
    };

    console.log('发送创建文档请求:', documentData);

    // 使用标准方法发送请求
    const response = await request.post('/document', documentData);

    console.log('创建文档响应:', response);

    if (response && response.code == 200) {
      ElMessage.success(response.message || '新建文档成功!');

      // 记录文档访问
      safeRecordAccess(response.id, "未命名文档");

      // 使用router.push跳转到编辑页面
      router.push({ name: 'edit', params: { id: response.id } });
    } else {
      // 如果API请求失败，显示警告并使用本地生成的ID作为后备方案
      console.warn('API请求返回错误，使用本地ID作为后备方案');
      ElMessage.warning('创建文档时遇到问题，使用本地模式');

      const newDocId = 'new-doc-' + Date.now();
      console.log('使用本地生成的ID:', newDocId);

      // 记录文档访问
      safeRecordAccess(newDocId, "未命名文档");

      // 使用router.push跳转到编辑页面
      router.push({ name: 'edit', params: { id: newDocId } });
    }
  } catch (error) {
    console.error('创建文档错误:', error);
    // 如果API请求抛出异常，使用本地生成的ID作为后备方案
    const newDocId = 'new-doc-' + Date.now();
    console.log('API请求失败，使用本地生成的ID:', newDocId);

    // 记录文档访问
    safeRecordAccess(newDocId, "未命名文档");

    ElMessage.warning('创建文档时遇到问题，使用本地模式');
    router.push({ name: 'edit', params: { id: newDocId } });
  } finally {
    // 确保关闭加载状态
    loadingInstance.close();
  }
};
// 导入文档
const importDoc = () => {
  fileInput.value.click();
};
// 处理文档输入
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在导入文档...",
  });
  if (file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      // 确保发送的是一个普通的JavaScript对象
      const documentData = {
        title: file.name.substring(0, file.name.lastIndexOf('.')),
        content: result.value
      };
      console.log('发送导入文档请求:', documentData);
      const response = await request.post('/document', documentData);
      if (response.code == 200) {
        // 记录文档访问
        safeRecordAccess(response.id, documentData.title);

        ElMessage.success('导入文档成功!');
        router.push({ name: 'edit', params: { id: response.id } });
      } else {
        ElMessage.error(response.message);
      }
    } catch (error) {
      console.error('导入文档错误:', error);
      ElMessage.error(error.message || '导入文档失败');
    } finally {
      loadingInstance.close();
    }
  }
};
// 更多功能
const getMore = () => {
  RightsDialog.value = true;
};
// 权益对比表格样式
const setHeader = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex == 1) {
    return { color: 'blueviolet' };
  }
  if (columnIndex == 2) {
    return { color: 'orange' };
  }
};
const setCell = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex == 1) {
    return { color: 'blueviolet' };
  }
  if (columnIndex == 2) {
    return { color: 'orange' };
  }
};
// 处理目录树节点点击
const handleNodeClick = (data) => {
  console.log('点击节点数据:', data);

  if (data.id) {
    // 将ID转为字符串，确保可以调用startsWith方法
    const idStr = String(data.id);

    // 检查是否是知识库项
    if (data.id && knowledgeBases.value.some(kb => String(kb.id) === idStr)) {
      console.log('点击了知识库:', idStr);
      router.push(`/dashboard/KnowledgeBasePage/${idStr}`);
    } else if (idStr === 'recent' || idStr === 'important') {
      console.log('点击了文档分类:', idStr);
      router.push('/dashboard/DocumentPage');
    } else {
      console.log('点击了文档:', idStr);
      router.push({ name: 'edit', params: { id: idStr } });
    }
  }
};
// 打开最近访问的文档
const openDocument = (docId) => {
  // 我们可以选择在打开最近文档时也记录访问
  // 这里不是必须的，因为用户已经访问过这个文档了
  // 但记录一次可以更新访问时间
  const doc = recentAccessDocs.value.find(d => d.id === docId);
  if (doc) {
    safeRecordAccess(docId, doc.title);
  }
  router.push({ name: 'edit', params: { id: docId } });
};

const displayedRecentDocs = ref([]);
const showAllRecent = ref(false);

const toggleShowAllRecent = (event) => {
  // 阻止事件冒泡，避免点击"查看更多"时触发打开文档
  if (event) {
    event.stopPropagation();
  }
  showAllRecent.value = !showAllRecent.value;
  updateDisplayedDocs();
};

const updateDisplayedDocs = () => {
  // 确保recentAccessDocs存在且是有效数组
  if (!recentAccessDocs.value || !Array.isArray(recentAccessDocs.value)) {
    console.log('最近访问文档数据无效，显示空列表');
    displayedRecentDocs.value = [];
    return;
  }

  console.log('更新最近访问文档显示，共有', recentAccessDocs.value.length, '条记录');

  if (showAllRecent.value) {
    displayedRecentDocs.value = recentAccessDocs.value;
  } else {
    displayedRecentDocs.value = recentAccessDocs.value.slice(0, 3);
  }

  console.log('显示', displayedRecentDocs.value.length, '条最近访问记录');
};

// 监听recentAccessDocs的变化
watch(recentAccessDocs, () => {
  updateDisplayedDocs();
}, { immediate: true });

// 初始化时设置显示的文档
onMounted(async () => {
  // 加载最近访问文档，使用强制刷新确保首次加载最新数据
  console.log('DashBoard组件挂载，加载最近访问数据');
  try {
    if (typeof knowledgeBaseStore.loadRecentAccessDocs === 'function') {
      await knowledgeBaseStore.loadRecentAccessDocs(true);
    } else {
      console.error('loadRecentAccessDocs方法不存在');
      // 如果方法不存在，至少更新一下显示
      updateDisplayedDocs();
    }
  } catch (error) {
    console.error('加载最近访问数据失败:', error);
  }
  updateDisplayedDocs();
});

// 监听路由变化，当从其他页面返回Dashboard时刷新最近访问记录
let lastPath = '';
watch(() => route.path, (newPath, oldPath) => {
  console.log(`路由变化: ${oldPath || 'none'} -> ${newPath}`);

  // 只有当从其他页面返回到Dashboard相关页面时才刷新
  if (newPath.includes('/dashboard') && lastPath && !lastPath.includes('/dashboard')) {
    console.log('从其他页面返回Dashboard，刷新最近访问数据');

    try {
      if (typeof knowledgeBaseStore.loadRecentAccessDocs === 'function') {
        knowledgeBaseStore.loadRecentAccessDocs(true).then(() => {
          console.log('最近访问数据已更新');
          updateDisplayedDocs();
        }).catch(err => {
          console.error('刷新最近访问数据失败:', err);
          updateDisplayedDocs(); // 即使失败也尝试更新显示
        });
      } else {
        console.error('loadRecentAccessDocs方法不存在');
        updateDisplayedDocs();
      }
    } catch (error) {
      console.error('刷新最近访问数据失败:', error);
      updateDisplayedDocs();
    }
  }

  // 记录上一个路径，用于判断是否是从其他页面返回
  lastPath = newPath;
}, { immediate: true });
</script>

<style scoped>
.platform {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--theme--color);
}

.platform-logo {
  width: 7vw;
  margin: 1vh auto;
}

.platform-title {
  position: relative;
  font-weight: bolder;
  font-size: 4vh;
  cursor: pointer;
  background: linear-gradient(135deg, #5DAEFF, #bd34fe);
  background-clip: text;
  color: transparent;
}

.platform-title::after {
  content: "";
  width: 0%;
  height: 3px;
  background: linear-gradient(135deg, #5DAEFF, #bd34fe);
  position: absolute;
  top: 100%;
  left: 50%;
  transition: all 0.5s;
}

.platform-title:hover:after {
  left: 0%;
  width: 100%;
}

.add-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 3vh 0;
}

.add {
  width: 80%;
  border: none;
  padding: 1.5vh 0;
  border-radius: 10px;
  background-color: var(--el-color-primary);
  color: #eee;
  cursor: pointer;
}

.import {
  width: 80%;
  border: 1px solid #DCDFE6;
  padding: 1.5vh 0;
  margin-top: 1vh;
  border-radius: 10px;
  background-color: #fff;
  color: var(--el-color-primary);
}

.import:hover {
  border: 1px solid var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  cursor: pointer;
}

.divider-title :deep(.el-divider__text) {
  line-height: 24px;
  background-color: var(--nav--color);
  color: #8c9db6;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  margin-left: 1vw;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 2.5vh;
}

.router-link {
  width: 80%;
  margin: 3vh auto 0;
}

.link {
  width: 100%;
  display: block;
  padding: 1.5vh 0;
  text-decoration: none;
  border-radius: 10px;
  color: var(--el-color-primary);
}

.link:hover {
  background-color: #DCDFE6;
  color: var(--el-color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.link.router-link-active {
  background-color: var(--el-color-primary-light-3);
  color: #eee;
}

.more {
  width: 100%;
  padding: 1.5vh 0;
  margin-top: 20vh;
  display: block;
  text-align: center;
  text-decoration: none;
  border-radius: 10px;
  color: var(--el-color-primary-light-3);
  background-color: #DCDFE6;
}

.more:hover {
  background-color: var(--el-color-primary-light-5);
  color: #eee;
  cursor: pointer;
}

.header {
  height: 6vh;
  box-shadow: 0 0 2rem 0 rgba(41, 48, 66, 0.1);
  display: flex;
  align-items: center;
  background-color: var(--nav--color);
  color: #606266;
}

.main {
  padding: 0;
}

.knowledge-tree {
  padding: 0 1rem;
  margin-top: 1rem;
}

.knowledge-tree h4 {
  color: #606266;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.recent-access {
  padding: 0 1rem;
  margin-top: 1.5rem;
}

.recent-access h4 {
  color: #606266;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.recent-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent-list li {
  padding: 0.5rem 0;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #606266;
  display: flex;
  align-items: center;
}

.recent-list li:hover {
  color: var(--el-color-primary);
}

.show-more {
  color: var(--el-color-primary) !important;
  text-align: center;
  padding: 5px 0;
  margin-top: 5px;
  border-top: 1px dashed #ebeef5;
  cursor: pointer;
}

.show-more:hover {
  background-color: #f5f7fa;
}

.access-time {
  margin-left: auto;
  font-size: 0.75rem;
  color: #909399;
}

.empty-recent {
  text-align: center;
  color: #909399;
  font-size: 0.85rem;
  padding: 1rem 0;
}
</style>