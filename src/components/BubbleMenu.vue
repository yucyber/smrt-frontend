<template>
  <bubble-menu
    :editor="editor"
    :tippy-options="{ duration: 100 }"
    v-if="editor"
  >
    <div class="bubble-menu">
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
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        <i class="ri-bold"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        <i class="ri-italic"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ 'is-active': editor.isActive('underline') }"
      >
        <i class="ri-underline"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
      >
        <i class="ri-strikethrough"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleHighlight().run()"
        :class="{ 'is-active': editor.isActive('highlight') }"
      >
        <i class="ri-mark-pen-line"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleSuperscript().run()"
        :disabled="!editor.can().chain().focus().toggleSuperscript().run()"
        :class="{ 'is-active': editor.isActive('superscript') }"
      >
        <i class="ri-superscript"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleSubscript().run()"
        :disabled="!editor.can().chain().focus().toggleSubscript().run()"
        :class="{ 'is-active': editor.isActive('subscript') }"
      >
        <i class="ri-subscript"></i>
      </button>
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
      >
        <i class="ri-double-quotes-l"></i>
      </button>
      <button @click="editor.chain().focus().setHorizontalRule().run()">
        <i class="ri-separator"></i>
      </button>
      <button @click="showCommentPanel" title="添加评论">
        <i class="ri-chat-1-line"></i>
      </button>
      <!-- <el-divider direction="vertical" /> -->
      <!-- <el-dropdown trigger="click">
        <el-button type="primary" text bg><i class="ri-bard-line"></i>AI <i class="ri-arrow-drop-down-fill"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="AIfunc('续写')"><i class="ri-edit-line"></i>文本续写</el-dropdown-item>
            <el-dropdown-item @click="AIfunc('润色')"><i class="ri-palette-fill"></i>修饰润色</el-dropdown-item>
            <el-dropdown-item @click="AIfunc('校对')"><i class="ri-shield-check-fill"></i>病句改写</el-dropdown-item>
            <el-dropdown-item @click="AIfunc('翻译')"><i class="ri-translate"></i>中英翻译</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown> -->
    </div>
  </bubble-menu>

  <!-- 评论面板 -->
  <CommentPanel
    v-if="showingCommentPanel"
    :editor="editor"
    :isVisible="showingCommentPanel"
    :selectedText="selectedText"
    :position="commentPanelPosition"
    @close="closeCommentPanel"
    @add-comment="addComment"
    :style="{
      position: 'absolute',
      left: `${commentPanelPosition.x}px`,
      top: `${commentPanelPosition.y}px`,
      zIndex: 1000,
    }"
  />
</template>

<script setup>
import { BubbleMenu } from "@tiptap/vue-3";
import { computed, ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import CommentPanel from "./CommentPanel.vue";
import { useUserStore } from "../stores/userStore.js";
// import {
//   ElButton,
//   ElDivider,
//   ElDropdown,
//   ElDropdownMenu,
//   ElDropdownItem,
// } from "element-plus";
// import { ElMessage, ElLoading } from "element-plus";

const props = defineProps({
  editor: Object,
});
const emit = defineEmits(["comment-added"]);
const userStore = useUserStore();

// 评论面板相关状态
const showingCommentPanel = ref(false);
const selectedText = ref("");
const commentPanelPosition = ref({ x: 0, y: 0 });
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

// 显示评论面板
const showCommentPanel = () => {
  const { from, to } = props.editor.state.selection;

  // 检查是否有选中文本
  if (from === to) {
    // 如果没有选中文本，显示提示
    alert("请先选中文本再添加评论");
    return;
  }

  // 获取选中的文本
  selectedText.value = props.editor.state.doc.textBetween(from, to, " ");

  // 计算评论面板位置
  const editorView = props.editor.view;
  const { top, right } = editorView.coordsAtPos(to);
  commentPanelPosition.value = {
    x: right + 10,
    y: top,
  };

  // 显示评论面板
  showingCommentPanel.value = true;
};

// 添加评论
const addComment = (commentData) => {
  const { from, to } = props.editor.state.selection;

  // 生成唯一的评论ID
  const commentId = uuidv4();

  // 创建评论数据
  const comment = {
    id: commentId,
    ...commentData,
    selectedText: selectedText.value,
    range: { from, to },
    user: {
      name: userStore.username || "匿名用户",
      id: userStore.userId || "1",
    },
  };

  // 应用评论标记
  props.editor
    .chain()
    .focus()
    .setMark("comment", { commentId, commentData: comment })
    .run();

  // 通知父组件评论已添加
  emit("comment-added", comment);

  // 关闭评论面板
  closeCommentPanel();
};

// 关闭评论面板
const closeCommentPanel = () => {
  showingCommentPanel.value = false;
  selectedText.value = "";
};
// AI功能
// const AIfunc = async (command) => {
//   let { from, to } = props.editor.state.selection;
//   if (from === to) {
//     ElMessage.warning("请先选中文本!");
//     return;
//   }
//   const selectedText = props.editor.state.doc.textBetween(from, to, " ");
//   const loadingInstance = ElLoading.service({
//     fullscreen: true,
//     text: "正在加载中...",
//   });
//   try {
//     const response = await fetch("/api/function/AIFunc", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ text: selectedText, command: command }),
//     });

//     if (!response.ok) {
//       throw new Error("网络响应不正常");
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder("utf-8");
//     let receivedText = "";
//     let firstChunk = true; // 标记是否是第一次插入

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       const decodedValue = decoder.decode(value, { stream: true });
//       receivedText += decodedValue;

//       let transaction;
//       if (command === "续写") {
//         loadingInstance.close();
//         transaction = props.editor.state.tr.insertText(decodedValue, to);
//       } else {
//         // 其他功能追加文本
//         if (firstChunk) {
//           loadingInstance.close();
//           transaction = props.editor.state.tr.insertText(
//             decodedValue,
//             from,
//             to
//           );
//           firstChunk = false; // 标记为已经插入过第一次
//         } else {
//           transaction = props.editor.state.tr.insertText(decodedValue, from);
//         }
//       }
//       props.editor.view.dispatch(transaction);

//       // 更新选区
//       from += decodedValue.length;
//       to += decodedValue.length;
//     }
//   } catch (error) {
//     ElMessage.error(error.message);
//   }
// };
</script>
