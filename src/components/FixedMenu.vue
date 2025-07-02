<template>
  <div class="fixed-menu">
    <el-tooltip content="撤回" :hide-after="0">
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().chain().focus().undo().run()"
      >
        <i class="ri-arrow-go-back-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="取消撤回" :hide-after="0">
      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().chain().focus().redo().run()"
      >
        <i class="ri-arrow-go-forward-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="清除样式" :hide-after="0">
      <!-- 将节点标准化为简单段落。删除当前所选内容中的所有标记。 -->
      <button
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
      >
        <i class="ri-eraser-fill"></i>
      </button>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-tooltip content="段落级别" :hide-after="0">
      <el-dropdown trigger="click">
        <button :class="{ 'is-active': headingStyle }">
          <i v-if="headingLevel == 0" class="ri-paragraph"></i>
          <i v-else :class="`ri-h-${headingLevel}`"></i>
          <i class="ri-arrow-drop-down-fill"></i>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              @click="editor.chain().focus().setParagraph().run()"
            >
              <i class="ri-paragraph"></i>正文</el-dropdown-item
            >
            <el-dropdown-item
              v-for="index in 4"
              :key="index"
              @click="
                editor.chain().focus().toggleHeading({ level: index }).run()
              "
            >
              <i :class="`ri-h-${index}`"></i>标题{{ index }}</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-tooltip>
    <el-tooltip content="字体" :hide-after="0">
      <el-dropdown trigger="click">
        <button>
          <i class="ri-font-family"></i>
          <i class="ri-arrow-drop-down-fill"></i>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              @click="editor.chain().focus().unsetFontFamily().run()"
              >默认</el-dropdown-item
            >
            <el-dropdown-item
              v-for="font in fontFamily"
              :key="font"
              @click="editor.chain().focus().setFontFamily(font).run()"
            >
              <div :style="{ fontFamily: font }">{{ font }}</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-tooltip>
    <el-tooltip content=" 加粗" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :disabled="!editor.can().chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        <i class="ri-bold"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="斜体" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :disabled="!editor.can().chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        <i class="ri-italic"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="下划线" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleUnderline().run()"
        :disabled="!editor.can().chain().focus().toggleUnderline().run()"
        :class="{ 'is-active': editor.isActive('underline') }"
      >
        <i class="ri-underline"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="删除线" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :disabled="!editor.can().chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
      >
        <i class="ri-strikethrough"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="文字颜色" :hide-after="0">
      <span>
        <el-popover trigger="click" width="250">
          <div class="color-box">
            <div
              class="color-item"
              v-for="color in colorList"
              :key="color"
              @click="editor.chain().focus().setColor(color).run()"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
          <template #reference>
            <button>
              <i class="ri-font-color"></i>
              <i class="ri-arrow-drop-down-fill"></i>
            </button>
          </template>
        </el-popover>
      </span>
    </el-tooltip>
    <el-tooltip content="文本高亮" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleHighlight().run()"
        :class="{ 'is-active': editor.isActive('highlight') }"
      >
        <i class="ri-mark-pen-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="代码" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleCode().run()"
        :disabled="!editor.can().chain().focus().toggleCode().run()"
        :class="{ 'is-active': editor.isActive('code') }"
      >
        <i class="ri-code-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="代码块" :hide-after="0">
      <button
        @click="handleCodeBlock"
        :class="{ 'is-active': editor.isActive('codeBlock') }"
      >
        <i class="ri-code-box-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="上标" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleSuperscript().run()"
        :disabled="!editor.can().chain().focus().toggleSuperscript().run()"
        :class="{ 'is-active': editor.isActive('superscript') }"
      >
        <i class="ri-superscript"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="下标" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleSubscript().run()"
        :disabled="!editor.can().chain().focus().toggleSubscript().run()"
        :class="{ 'is-active': editor.isActive('subscript') }"
      >
        <i class="ri-subscript"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="链接" :hide-after="0">
      <button
        @click="openLinkDialog"
        :class="{ 'is-active': editor.isActive('link') }"
      >
        <i class="ri-link"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="取消链接" :hide-after="0">
      <button
        @click="editor.chain().focus().unsetLink().run()"
        :disabled="!editor.isActive('link')"
      >
        <i class="ri-link-unlink"></i>
      </button>
    </el-tooltip>
    <!-- <el-tooltip content="插入图片" :hide-after="0">
      <button @click="imageDialogVisible = true">
        <i class="ri-image-add-line"></i>
      </button>
    </el-tooltip> -->
    <el-tooltip content="表格" :hide-after="0">
      <span>
        <el-dropdown trigger="click">
          <button>
            <i class="ri-table-view"></i>
            <i class="ri-arrow-drop-down-fill"></i>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                @click="
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                "
                >插入表格</el-dropdown-item
              >
              <el-dropdown-item
                divided
                @click="editor.chain().focus().addRowAfter().run()"
                >添加行</el-dropdown-item
              >
              <el-dropdown-item
                @click="editor.chain().focus().deleteRow().run()"
                >删除行</el-dropdown-item
              >
              <el-dropdown-item
                divided
                @click="editor.chain().focus().addColumnAfter().run()"
                >添加列</el-dropdown-item
              >
              <el-dropdown-item
                @click="editor.chain().focus().deleteColumn().run()"
                >删除列</el-dropdown-item
              >
              <el-dropdown-item
                divided
                @click="editor.chain().focus().mergeCells().run()"
                >合并单元格</el-dropdown-item
              >
              <el-dropdown-item
                @click="editor.chain().focus().splitCell().run()"
                >拆分单元格</el-dropdown-item
              >
              <el-dropdown-item
                @click="editor.chain().focus().deleteTable().run()"
                >删除表格</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </span>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-tooltip content="无序列表" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        <i class="ri-list-unordered"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="有序列表" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        <i class="ri-list-ordered-2"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="任务列表" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleTaskList().run()"
        :class="{ 'is-active': editor.isActive('taskList') }"
      >
        <i class="ri-task-line"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="左对齐" :hide-after="0">
      <button
        @click="editor.chain().focus().setTextAlign('left').run()"
        :class="{
          'is-active': editor.isActive('textAlign', { align: 'left' }),
        }"
      >
        <i class="ri-align-left"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="居中对齐" :hide-after="0">
      <button
        @click="editor.chain().focus().setTextAlign('center').run()"
        :class="{
          'is-active': editor.isActive('textAlign', { align: 'center' }),
        }"
      >
        <i class="ri-align-center"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="右对齐" :hide-after="0">
      <button
        @click="editor.chain().focus().setTextAlign('right').run()"
        :class="{
          'is-active': editor.isActive('textAlign', { align: 'right' }),
        }"
      >
        <i class="ri-align-right"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="引用" :hide-after="0">
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
      >
        <i class="ri-double-quotes-l"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="强制换行" :hide-after="0">
      <button @click="editor.chain().focus().setHardBreak().run()">
        <i class="ri-text-wrap"></i>
      </button>
    </el-tooltip>
    <el-tooltip content="分隔线" :hide-after="0">
      <button @click="editor.chain().focus().setHorizontalRule().run()">
        <i class="ri-separator"></i>
      </button>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-dropdown trigger="click">
      <el-button type="primary" text bg
        ><i class="ri-bard-line"></i>AI <i class="ri-arrow-drop-down-fill"></i>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="documentSummary()">
            <i class="ri-file-text-line"></i>文档摘要
          </el-dropdown-item>
          <el-dropdown-item @click="AIfunc('续写')"
            ><i class="ri-edit-line"></i>文本续写</el-dropdown-item
          >
          <el-dropdown-item @click="AIfunc('润色')"
            ><i class="ri-palette-fill"></i>修饰润色</el-dropdown-item
          >
          <el-dropdown-item @click="AIfunc('校对')"
            ><i class="ri-shield-check-fill"></i>病句改写</el-dropdown-item
          >
          <el-dropdown-item @click="AIfunc('翻译')"
            ><i class="ri-translate"></i>中英翻译</el-dropdown-item
          >
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <!-- </div> -->
    <!-- 插入链接对话框 -->
    <el-dialog v-model="linkDialogVisible" title="插入链接" width="500">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="文本内容">
          <el-input v-model="linkForm.text" autocomplete="off" />
        </el-form-item>
        <el-form-item label="链接 URL">
          <el-input v-model="linkForm.url" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-confirm-btn dialog-footer">
          <el-button @click="linkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmLink">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
  <!-- 插入图片对话框 -->
  <!-- <el-dialog v-model="imageDialogVisible" title="插入图片" width="500">
    <el-form :model="imageForm">
      <el-form-item label="图片 URL">
        <el-input v-model="imageForm.url" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="imageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImage"> 确定 </el-button>
      </div>
    </template>
  </el-dialog> -->
  <!-- 摘要弹窗 -->
  <el-dialog
    v-model="summaryDialogVisible"
    title="📄 文档摘要"
    width="60%"
    :close-on-click-modal="false"
  >
    <div class="summary-content">
      <div v-if="summaryLoading" class="loading-area">
        <el-skeleton :rows="5" animated />
        <p style="text-align: center; margin-top: 20px">正在生成摘要...</p>
      </div>
      <div v-else-if="summaryText" class="summary-text">
        <div class="summary-header">
          <i class="ri-lightbulb-line"></i>
          <span>AI生成的文档摘要</span>
        </div>
        <div class="summary-body" v-html="summaryText"></div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="summaryDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copySummary">复制摘要</el-button>
        <el-button type="success" @click="insertSummaryToDoc"
          >插入到文档</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, reactive } from "vue";
import {
  ElButton,
  ElTooltip,
  ElDivider,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElPopover,
  ElDialog, // 引入 ElDialog
  ElForm, // 引入 ElForm
  ElFormItem, // 引入 ElFormItem
  ElInput, // 引入 ElInput
} from "element-plus";
import { ElMessage, ElLoading } from "element-plus";
import colorList from "../utils/colors.js";
import fontFamily from "../utils/fontFamily.js";

const props = defineProps({
  editor: Object,
});

const linkDialogVisible = ref(false);
// const imageDialogVisible = ref(false);
const linkForm = reactive({ url: "" });
// const imageForm = reactive({ url: "" });

// 计算标题级别
const headingLevel = computed(() => {
  for (let level = 1; level <= 4; level++) {
    if (props.editor.isActive("heading", { level })) {
      return level;
    }
  }
  return 0; // 正文
});
// 计算标题样式
const headingStyle = computed(() => {
  if (headingLevel.value == 0) {
    return props.editor.isActive("paragraph");
  }
  return props.editor.isActive("heading", { level: headingLevel.value });
});

//链接处理
const openLinkDialog = () => {
  const { from, to } = props.editor.state.selection;
  const text = props.editor.state.doc.textBetween(from, to, " ");
  const previousUrl = props.editor.getAttributes("link").href;

  linkForm.text = text;
  linkForm.url = previousUrl || "";
  linkDialogVisible.value = true;
};

const handleConfirmLink = () => {
  const url = linkForm.url.trim();
  const text = linkForm.text.trim();

  // 先关闭对话框
  linkDialogVisible.value = false;

  // 如果 URL 为空，则表示取消链接
  if (!url) {
    props.editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  if (!text) {
    ElMessage.warning("文本内容不能为空!");
    return;
  }

  // 如果文本内容不为空，则插入带链接的文本
  if (text) {
    let finalUrl = url;
    if (!/^(https?:\/\/|mailto:)/i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    props.editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: text,
        marks: [
          {
            type: "link",
            attrs: { href: finalUrl },
          },
        ],
      })
      .run();
  }
};

// const handleConfirmImage = () => {
//   const url = imageForm.url;
//   if (url) {
//     props.editor.chain().focus().setImage({ src: url }).run();
//   }
//   imageDialogVisible.value = false;
//   imageForm.url = ""; // 重置表单
// };

// 添加图片
// const addImage = () => {
//   const url = window.prompt("URL");
//   if (url === null) return; // Abort if the user cancels
//   props.editor.chain().focus().setImage({ src: url }).run();
// };

// 修改代码块处理函数
const handleCodeBlock = () => {
  const { from, to } = props.editor.state.selection;

  if (from === to) {
    // 如果没有选中文本，直接切换代码块
    props.editor.chain().focus().toggleCodeBlock().run();
  } else {
    // 如果有选中文本，获取选中的内容
    const selectedText = props.editor.state.doc.textBetween(from, to, "\n");

    // 检查当前是否已经在代码块中
    if (props.editor.isActive("codeBlock")) {
      // 如果已经是代码块，则取消代码块格式
      props.editor.chain().focus().toggleCodeBlock().run();
    } else {
      // 删除选中的内容并插入一个包含所有内容的代码块
      props.editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: "codeBlock",
          content: [
            {
              type: "text",
              text: selectedText,
            },
          ],
        })
        .run();
    }
  }
};

// 文档摘要dialog
const summaryDialogVisible = ref(false);
const summaryLoading = ref(false);
const summaryText = ref("");

// 文档摘要功能
const documentSummary = async () => {
  const fullText = props.editor.getText();

  if (!fullText.trim()) {
    ElMessage.warning("文档内容为空!");
    return;
  }

  // 显示弹窗并开始加载
  summaryDialogVisible.value = true;
  summaryLoading.value = true;
  summaryText.value = "";

  try {
    const response = await fetch("/api/function/chatglm/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: fullText }] }),
    });

    if (!response.ok) {
      throw new Error("网络响应不正常");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const decodedValue = decoder.decode(value, { stream: true });
      result += decodedValue;

      // 实时更新摘要内容
      summaryText.value = result.replace(/\n/g, "<br>");
    }

    summaryLoading.value = false;
    ElMessage.success("文档摘要生成完成!");
  } catch (error) {
    summaryLoading.value = false;
    ElMessage.error("生成摘要失败: " + error.message);
  }
};

// 复制摘要
const copySummary = () => {
  navigator.clipboard.writeText(summaryText.value.replace(/<br>/g, "\n"));
  ElMessage.success("摘要已复制到剪贴板!");
};

// 插入摘要到文档
const insertSummaryToDoc = () => {
  props.editor
    .chain()
    .focus()
    .setTextSelection(0)
    .insertContent(
      `<h2>📄 文档摘要</h2><div class="summary-block">${summaryText.value}</div><hr><br>`
    )
    .run();
  summaryDialogVisible.value = false;
  ElMessage.success("摘要已插入到文档开头!");
};
</script>

<style scoped lang="scss">
.dialog-confirm-btn .el-button {
  margin: 0 1px;
  padding: 8px 10px;
  border-radius: 5px;
  color: rgba(0, 0, 0, 0.464);
  border: rgba(96, 96, 96, 0.327) 1px solid;
}

.summary-content {
  min-height: 200px;
}

.loading-area {
  padding: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: #409eff;
  font-weight: bold;
}

.summary-header i {
  margin-right: 8px;
  font-size: 18px;
}

.summary-body {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  line-height: 1.6;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
