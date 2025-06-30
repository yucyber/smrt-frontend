<template>
  <div class="container">
    <h2 class="title">我的文档</h2>
    <div class="documents-grid">
      <div v-for="(doc, index) in documents" :key="index" class="document-card" @click="handleClick(doc.id)">
        <img src="../assets/images/doc.png" alt="Document" class="document-logo">
        <div class="document-title">{{ doc.title }}</div>
        <el-dropdown class="document-dropdown">
          <el-icon :size="18">
            <Setting />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openInNewTab(doc.id)">新标签打开</el-dropdown-item>
              <el-dropdown-item @click="addTemplate(doc.id)">另存为模板</el-dropdown-item>
              <el-dropdown-item @click="addFavorite(doc.id)">收藏文档</el-dropdown-item>
              <el-dropdown-item @click="addRecycle(doc.id)">放入回收站</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import request from "../utils/request.js";
import router from "../router";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const documents = ref([]);

const loadDocuments = async () => {
  try {
    NProgress.start();
    console.log('正在获取用户文档列表...');
    const response = await request.get("/document/user");
    console.log('文档响应:', response);

    if (response && response.code == 200) {
      documents.value = response.documents || [];
      if (documents.value.length === 0) {
        console.log('用户没有文档');
      }
    } else {
      console.warn('获取文档失败:', response?.message);
    }
  } catch (error) {
    console.error('加载文档错误:', error);
    if (error.response) {
      console.error('错误响应:', error.response);
    }
    ElMessage.error(error.message || '加载文档失败');
  } finally {
    NProgress.done();
  }
};
// 在新标签中打开文档
const openInNewTab = (id) => {
  const url = router.resolve({ name: 'edit', params: { id: id } }).href;
  window.open(url, '_blank');
};
// 另存为模板
const addTemplate = async (id) => {
  try {
    NProgress.start();
    const response = await request.put(`/document/template/${id}`);
    if (response.code == 200) {
      ElMessage.success(response.message);
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    NProgress.done();
  }
};
// 收藏文档
const addFavorite = async (id) => {
  try {
    NProgress.start();
    const response = await request.put(`/document/favorite/${id}`);
    if (response.code == 200) {
      ElMessage.success(response.message);
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    NProgress.done();
  }
};
// 放入回收站
const addRecycle = async (id) => {
  try {
    NProgress.start();
    const response = await request.put(`/document/delete/${id}`);
    if (response.code == 200) {
      ElMessage.success(response.message);
      loadDocuments();
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    NProgress.done();
  }
};
// 点击文档
const handleClick = (id) => {
  // 记录访问 - 先获取文档标题
  const doc = documents.value.find(doc => doc.id === id);
  if (doc) {
    console.log('文档页面点击记录访问:', id, doc.title);

    // 直接调用API记录访问
    request({
      url: '/knowledge_base/user/document-access',
      method: 'post',
      data: {
        document_id: id,
        title: doc.title
      }
    }).catch(error => {
      console.error('记录文档访问失败:', error);
    });
  }

  router.push({ name: 'edit', params: { id: id } });
};

onMounted(loadDocuments);
</script>

<style scoped>
.container {
  margin: 2vh 2vw;
}

.title {
  color: #555;
}

.documents-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 2vh;
}

.document-card {
  width: 10%;
  margin: 3vh 1.5vw;
  margin-bottom: 1vh;
  position: relative;
  cursor: pointer;
}

.document-card:hover {
  background-color: #f5f5f5;
  border-radius: 1vh;
}

.document-logo {
  width: 100%;
}

.document-title {
  text-align: center;
  font-family: Arial, sans-serif;
  color: #555;
  font-weight: bold;
}

.document-dropdown {
  position: absolute;
  top: 0.5vh;
  right: 0.5vw;
  visibility: hidden;
}

.document-card:hover .document-dropdown {
  visibility: visible
}
</style>