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
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import request from "../utils/request.js";
import router from "../router/index.js";
import htmlToPDF from "../utils/htmlToPDF.js";

// 从父组件接收 editor 实例
const props = defineProps({
  editor: Object,
  title: String,
});
const emit = defineEmits(["reload", "updateTitle"]);

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
    const response = await request.put(
      "/document/" + router.currentRoute.value.params.id,
      { title: props.title, content: props.editor.getHTML() }
    );
    if (response.code == 200) {
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
  padding: 10px 20px;
}
</style>
