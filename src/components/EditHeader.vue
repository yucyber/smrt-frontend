<template>
  <div class="edit-header">
    <div class="left-group">
      <el-tooltip content="回到首页" :hide-after="0">
        <el-button @click="returnHome()" class="icon exclude">
          <el-icon :size="22">
            <HomeFilled />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="创建文档" :hide-after="0">
        <el-button @click="createDoc()" class="icon exclude">
          <el-icon :size="22">
            <Plus />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical" />
      <el-tooltip content="保存" :hide-after="0">
        <el-button @click="save()" class="icon">
          <i style="font-size: 22px" class="ri-save-3-line"></i>
        </el-button>
      </el-tooltip>
      <el-tooltip content="下载" :hide-after="0">
        <el-button @click="download(title)" class="icon exclude">
          <i style="font-size: 22px" class="ri-download-2-line"></i>
        </el-button>
      </el-tooltip>
    </div>
    <div style="font-size: 20px; margin-left: 45%">
      <input
        type="text"
        :value="title"
        @input="updateTitle"
        style="background: none; border: 0px; outline: none"
      />
    </div>
    <div class="right-group">
      <!-- 分享按钮 -->
      <el-tooltip content="分享文档" :hide-after="0">
        <el-button @click="shareDocument()" class="icon exclude">
          <i style="font-size: 22px" class="ri-share-line"></i>
        </el-button>
      </el-tooltip>

      <!-- 协同编辑用户头像 -->
      <div class="collaboration-users">
        <el-tooltip
          v-for="user in collaborationUsers"
          :key="user.clientId"
          :content="user.name || '匿名用户'"
          :hide-after="0"
        >
          <div
            class="user-avatar"
            :style="{ backgroundColor: user.color || '#f783ac' }"
          >
            {{ getUserInitial(user.name) }}
          </div>
        </el-tooltip>
        <div v-if="collaborationUsers.length === 0" class="no-users">
          <el-icon :size="16" color="#999">
            <User />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import { User } from "@element-plus/icons-vue";
import request from "../utils/request.js";
import router from "../router/index.js";
import htmlToPDF from "../utils/htmlToPDF.js";

// 从父组件接收 editor 实例
const props = defineProps({
  editor: Object,
  title: String,
});
const emit = defineEmits(["reload", "updateTitle"]);

// 协同编辑用户状态
const collaborationUsers = ref([]);
let awarenessChangeHandler = null;

// 获取用户名首字母
const getUserInitial = (name) => {
  if (!name || name === "匿名用户") return "?";
  return name.charAt(0).toUpperCase();
};

// 更新协同编辑用户列表
const updateCollaborationUsers = () => {
  if (!props.editor) return;

  // 获取 WebSocket provider (从 EditView.vue 传递的 editor 中获取)
  const extensions = props.editor.extensionManager.extensions;
  const collaborationCursor = extensions.find(
    (ext) => ext.name === "collaborationCursor"
  );

  if (collaborationCursor && collaborationCursor.options.provider) {
    const provider = collaborationCursor.options.provider;
    const awarenessStates = provider.awareness.getStates();
    const currentClientId = provider.awareness.clientID;

    // 使用Map来去重，基于用户名进行去重
    const userMap = new Map();

    awarenessStates.forEach((state, clientId) => {
      if (clientId !== currentClientId && state.user && state.user.name) {
        const userName = state.user.name;
        // 如果用户名已存在，保留最新的状态（后面的会覆盖前面的）
        userMap.set(userName, {
          clientId,
          name: state.user.name,
          color: state.user.color,
        });
      }
    });

    // 将Map转换为数组
    collaborationUsers.value = Array.from(userMap.values());
  }
};

// 监听 editor 变化，设置 awareness 监听器
watch(
  () => props.editor,
  (newEditor) => {
    if (newEditor) {
      // 清除之前的监听器
      if (awarenessChangeHandler) {
        const extensions = newEditor.extensionManager.extensions;
        const collaborationCursor = extensions.find(
          (ext) => ext.name === "collaborationCursor"
        );
        if (collaborationCursor && collaborationCursor.options.provider) {
          collaborationCursor.options.provider.awareness.off(
            "change",
            awarenessChangeHandler
          );
        }
      }

      // 设置新的监听器
      const extensions = newEditor.extensionManager.extensions;
      const collaborationCursor = extensions.find(
        (ext) => ext.name === "collaborationCursor"
      );

      if (collaborationCursor && collaborationCursor.options.provider) {
        const provider = collaborationCursor.options.provider;

        awarenessChangeHandler = () => {
          updateCollaborationUsers();
        };

        provider.awareness.on("change", awarenessChangeHandler);

        // 初始化用户列表
        updateCollaborationUsers();
      }
    }
  },
  { immediate: true }
);

// 组件卸载时清理监听器
onBeforeUnmount(() => {
  if (awarenessChangeHandler && props.editor) {
    const extensions = props.editor.extensionManager.extensions;
    const collaborationCursor = extensions.find(
      (ext) => ext.name === "collaborationCursor"
    );
    if (collaborationCursor && collaborationCursor.options.provider) {
      collaborationCursor.options.provider.awareness.off(
        "change",
        awarenessChangeHandler
      );
    }
  }
});
// 在创建或保存成功后，触发 reload 事件，通知父组件刷新左侧的文档列表。
const reload = () => {
  emit("reload");
};

const updateTitle = (event) => {
  emit("updateTitle", event.target.value);
};

// 返回文档页面
const returnHome = () => {
  router.push("/dashboard/DocumentPage");
};

// 新建文档
const createDoc = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在新建文档...",
  });
  try {
    const response = await request.post("/document", {
      title: "未命名文档",
      content: "",
    });
    if (response.code == 200) {
      ElMessage.success("新建文档成功!");
      router.push({ name: "edit", params: { id: response.id } });
      reload();
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    loadingInstance.close();
  }
};

// 保存文档
const save = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在保存...",
  });
  try {
    const documentId = router.currentRoute.value.params.id;
    const content = props.editor.getHTML();

    // 保存文档
    const response = await request.put("/document/" + documentId, {
      title: props.title,
      content: content,
    });

    if (response.code == 200) {
      // 创建历史版本
      try {
        await request.post(`/document/${documentId}/versions`, {
          content: content,
          summary: `保存于 ${new Date().toLocaleString()}`,
        });
      } catch (versionError) {
        console.warn("创建历史版本失败:", versionError);
        // 不影响保存操作，只是记录警告
      }

      ElMessage.success("保存成功！");
      reload();
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    loadingInstance.close();
  }
};

// 下载文档
const download = (fileName) => {
  let element = document.querySelector("#editor-content");
  // 设置打印区域的高度和overflow属性，否则打印内容会被截断为浏览器视图的高度
  element.style.overflowY = "visible";
  element.style.height = "auto";
  const fileList = document.getElementById("editor-content"); // 很重要
  htmlToPDF(fileName, element, fileList);
  // 恢复原来的样式
  element.style.overflowY = "auto";
  element.style.height = "100%";
};

// 分享文档
const shareDocument = async () => {
  const documentId = router.currentRoute.value.params.id;

  // 检查是否是新文档（未保存）
  if (documentId.toString().startsWith("new-doc-")) {
    ElMessage.warning("请先保存文档后再分享");
    return;
  }

  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在生成分享链接...",
  });

  try {
    const response = await request.post(`/document/${documentId}/share`);

    if (response.code == 200) {
      // 从响应中获取分享ID
      const shareId = response.share?.id;

      if (!shareId) {
        console.error("分享ID不存在:", response);
        ElMessage.error("生成分享链接失败: 无法获取分享ID");
        return;
      }

      // 构建完整的分享链接
      const shareLink = `${window.location.origin}/edit/${documentId}?share=${shareId}`;

      // 复制到剪贴板
      await navigator.clipboard.writeText(shareLink);

      ElMessage.success({
        message: "分享链接已复制到剪贴板！",
        duration: 5000,
      });

      // 显示分享链接对话框
      ElMessageBox.alert(
        `<div style="word-break: break-all;">${shareLink}</div>`,
        "分享链接",
        {
          confirmButtonText: "确定",
          dangerouslyUseHTMLString: true,
          callback: () => {},
        }
      );
    } else {
      ElMessage.error(response.message || "生成分享链接失败");
    }
  } catch (error) {
    console.error("分享文档错误:", error);
    ElMessage.error(error.message || "分享文档时发生错误");
  } finally {
    loadingInstance.close();
  }
};
</script>

<style scoped>
.icon {
  padding: 2px 3px;
  margin: 0 4px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: transparent;
}

.edit-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}

.left-group {
  display: flex;
  align-items: center;
}

.right-group {
  display: flex;
  align-items: center;
}

.collaboration-users {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 20px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.no-users {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
}

/* 协同编辑用户头像动画 */
.collaboration-users .user-avatar {
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
