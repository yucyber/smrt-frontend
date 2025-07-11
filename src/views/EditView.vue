<template>
  <el-container class="container">
    <el-header class="header">
      <EditHeader
        :title="title"
        :editor="editor"
        @reload="loadDocuments"
        @updateTitle="title = $event"
      />
    </el-header>
    <el-main class="main">
      <FixedMenu v-if="editor" :editor="editor" />
      <BubbleMenu
        v-if="editor"
        :editor="editor"
        :tippy-options="{ duration: 100 }"
        @comment-added="handleCommentAdded"
      />

      <div class="editor-container">
        <div class="left-side">
          <div class="title" :class="{ 'outline-active': catalog }">
            <div
              @click="catalog = false"
              :class="['option', { 'option-active': !catalog }]"
            >
              文 档
            </div>
            <div
              @click="catalog = true"
              :class="['option', { 'option-active': catalog }]"
            >
              大 纲
            </div>
            <div class="slider"></div>
          </div>
          <transition name="fade" mode="out-in">
            <div v-if="catalog" key="catalog">
              <transition-group name="fade" tag="div">
                <div
                  v-for="item in outline"
                  :key="item.index"
                  :level="item.level"
                  class="outline-item"
                  @click="goToHeading(item)"
                >
                  {{ item.text }}
                </div>
              </transition-group>
            </div>
            <div v-else key="docs">
              <div
                class="doc"
                :class="{
                  'doc-active': doc.id == router.currentRoute.value.params.id,
                }"
                v-for="doc in documents"
                :key="doc.id"
                @click="handleDocClick(doc.id)"
              >
                <h3>{{ doc.title }}</h3>
                <p>{{ doc.content.replace(/<[^>]*>/g, " ") }}</p>
              </div>
            </div>
          </transition>
        </div>
        <div class="content">
          <editor-content :editor="editor" id="editor-content" />
        </div>
      </div>
      <div class="word-count">
        总字符数：{{ editor?.storage.characterCount.characters() }}
      </div>

      <!-- 评论列表 -->
      <CommentList
        v-if="showCommentList && comments.length > 0"
        :comments="comments"
        :editor="editor"
        @close="showCommentList = false"
        @delete-comment="deleteComment"
        @go-to-comment="goToComment"
        class="comment-list-container"
      />

      <!-- 评论按钮 -->
      <el-button
        v-if="comments.length > 0"
        class="comment-toggle-btn"
        type="primary"
        size="small"
        @click="toggleCommentList"
      >
        <i class="ri-chat-1-line"></i>
        评论 ({{ comments.length }})
      </el-button>

      <!-- 文档历史版本组件 -->
      <DocumentHistory
        ref="documentHistoryRef"
        :editor="editor"
        :document-id="router.currentRoute.value.params.id"
        @version-restored="handleVersionRestored"
      />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";
import { ElContainer, ElHeader, ElMain, ElLoading } from "element-plus";
import { ElMessage } from "element-plus";
import EditHeader from "../components/EditHeader.vue";
import FixedMenu from "../components/FixedMenu.vue";
import BubbleMenu from "../components/BubbleMenu.vue";
import request from "../utils/request.js";
import router from "../router";
import { useRoute } from "vue-router";
import { useUserStore } from "../stores/userStore.js";

// 接收分享ID属性
const props = defineProps({
  shareId: {
    type: String,
    default: "",
  },
});
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEditor, EditorContent, VueNodeViewRenderer } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
// import css from "highlight.js/lib/languages/css";
// import js from "highlight.js/lib/languages/javascript";
// import ts from "highlight.js/lib/languages/typescript";
// import html from "highlight.js/lib/languages/xml";
// import python from "highlight.js/lib/languages/python";
// import java from "highlight.js/lib/languages/java";
import { createLowlight } from "lowlight";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { Color } from "@tiptap/extension-color";
import VueComponent from "../utils/Extension.js";
import slash from "../utils/slash.js";
import suggestion from "../utils/suggestion.js";
import { Comment } from "../utils/CommentExtension.js";
import CommentList from "../components/CommentList.vue";
import DocumentHistory from "../components/DocumentHistory.vue";
import "highlight.js/styles/github.css"; // 添加这一行
import { common } from "lowlight";
// 移除History扩展的导入，因为它与Collaboration扩展不兼容
const lowlight = createLowlight(common);
// lowlight.register({ html, css, js, ts, python, java });
lowlight.register(common);
const title = ref("");
const documents = ref([]);
const catalog = ref(false);
const route = useRoute();
const userStore = useUserStore();

// 评论相关状态
const comments = ref([]);
const showCommentList = ref(false);
const commentListPosition = ref({ x: 0, y: 0 });

// 文档历史版本相关
const documentHistoryRef = ref(null);
const autoSaveTimer = ref(null);
const lastSavedContent = ref("");
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5分钟自动保存
// 生成用户颜色的函数
const generateUserColor = (username) => {
  if (!username) return "#f783ac";

  // 基于用户名生成一致的颜色
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 生成明亮且对比度好的颜色
  const colors = [
    "#f783ac",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
  ];

  return colors[Math.abs(hash) % colors.length];
};

// 创建编辑器实例
// 在现有的 import 语句中添加
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// 创建 Y.js 文档和 WebSocket 提供者
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "example-document",
  ydoc
);

// 在 useEditor 的 extensions 数组中添加协同编辑扩展
const editor = useEditor({
  content: "",
  extensions: [
    StarterKit.configure({
      codeBlock: false,
      // 禁用默认的历史记录，因为协同编辑有自己的历史处理
      history: false,
    }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Superscript,
    Subscript,
    TextStyle,
    Color,
    FontFamily,
    Typography,
    TaskList,
    TaskItem,
    CharacterCount,
    Highlight.configure({ multicolor: true }),
    Link,
    Image,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    // Placeholder.configure({
    //   placeholder: ({ node }) => {
    //     if (node.type.name === "paragraph" && node.childCount === 0) {
    //       return "键入 / 以唤起AI助手...";
    //     }
    //     return "开始输入...";
    //   },
    // }),
    // CodeBlockLowlight.configure({ lowlight }),
    CodeBlockLowlight.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          language: {
            default: null,
          },
        };
      },
      // addNodeView() {
      //   return VueNodeViewRenderer(CodeBlockComponent);
      // },
    }).configure({
      lowlight,
    }),
    VueComponent,
    // slash.configure({ suggestion }),
    // 添加协同编辑扩展
    Collaboration.configure({
      document: ydoc,
    }),

    // 添加协同光标扩展
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: userStore.username || "匿名用户", // 从用户状态获取真实用户名
        color: generateUserColor(userStore.username), // 基于用户名生成颜色
      },
    }),

    // 添加评论扩展
    Comment,

    // 注意：不要同时使用History和Collaboration扩展，因为它们不兼容
    // Collaboration扩展已经包含了自己的历史记录功能

    // ... 其他扩展
  ],
});

// 计算大纲
const outline = computed(() => {
  const matches = [];
  editor.value?.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      const start = pos;
      const end = pos + node.content.size;
      const level = node.attrs.level;
      const text = node.textContent;
      matches.push({ start, end, level, text });
    }
  });
  return matches;
});

// 跳转到大纲
const goToHeading = (item) => {
  if (!editor.value) return;

  // 1. 使用 Tiptap 的 API 获取标题节点在 DOM 中的精确位置
  const { view } = editor.value;
  const node = view.nodeDOM(item.start);

  // 2. 如果找到了对应的 DOM 节点，则执行平滑滚动
  if (node) {
    node.scrollIntoView({
      behavior: "smooth", // 关键：指定平滑滚动
      block: "center", // 关键：将元素滚动到视口中央
      inline: "nearest",
    });
  }

  // 3. 执行 Tiptap 的选中和高亮操作，提供视觉反馈
  const selection = { from: item.start, to: item.end + 1 };
  editor.value
    .chain()
    // .focus() // 先聚焦，确保后续操作在正确的编辑器实例上
    .setTextSelection(selection)
    .setHighlight({ color: "#dedcff" }) // 设置临时高亮
    .run();

  // 4. 在短暂延迟后移除高亮，并将光标定位到标题末尾
  setTimeout(() => {
    if (editor.value) {
      // 检查 editor 实例是否仍然存在
      editor.value
        .chain()
        // .focus()
        .setTextSelection(selection)
        .unsetHighlight() // 移除高亮
        .run();
    }
  }, 800);
};

// 加载文档
const loadDocuments = async () => {
  try {
    NProgress.start();

    // 获取当前文档ID
    const currentDocId = router.currentRoute.value.params.id;
    console.log("加载文档, ID:", currentDocId);

    // 检查是否是新创建的文档（ID以new-doc-开头）
    const isNewDoc = currentDocId.toString().startsWith("new-doc-");

    // 检查是否是通过分享链接访问
    const shareId = props.shareId || router.currentRoute.value.query.share;
    const isSharedDoc = !!shareId;

    // 如果不是分享链接访问，加载用户文档列表
    if (!isSharedDoc) {
      try {
        let response = await request.get("/document/user");
        if (response.code == 200) {
          documents.value = response.documents || [];
        } else {
          console.warn("获取文档列表失败:", response?.message);
          documents.value = [];
        }
      } catch (error) {
        console.warn("获取文档列表错误:", error);
        documents.value = [];
      }
    }

    // 处理新创建的文档
    if (isNewDoc) {
      console.log("处理新创建的文档");
      // 为新文档设置默认内容和标题
      editor.value.commands.setContent(
        "<h1>未命名文档</h1><p>开始输入文档内容...</p>"
      );
      title.value = "未命名文档";

      // 确保编辑器处于可编辑状态
      editor.value.setEditable(true);

      // 将新文档添加到文档列表的开头
      documents.value.unshift({
        id: currentDocId,
        title: "未命名文档",
        content: "<h1>未命名文档</h1><p>开始输入文档内容...</p>",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      NProgress.done();
      return;
    }

    // 加载文档内容（区分普通访问和分享链接访问）
    let response;
    if (isSharedDoc && shareId) {
      // 通过分享链接访问
      console.log("通过分享链接访问文档，分享ID:", shareId);
      response = await request.get(`/document/share/${shareId}`);
    } else {
      // 普通访问
      response = await request.get("/document/" + currentDocId);
    }

    if (response.code == 200) {
      editor.value.commands.setContent(response.document.content);

      // 初始化lastSavedContent
      lastSavedContent.value = response.document.content;

      // 判断是否为模板文档（只读）
      const isTemplateDoc = response.document.user_id == 1;
      // 判断是否为分享文档（可编辑）
      const isSharedDocument = !!isSharedDoc;

      // 设置编辑权限
      if (isTemplateDoc) {
        editor.value.setEditable(false);
        //禁用编辑按钮
        document.querySelectorAll("button").forEach((item) => {
          if (!item.classList.contains("exclude")) {
            item.disabled = true;
          }
        });
        ElMessage.info("只读模式");
      } else {
        // 分享文档或自己的文档都可以编辑
        editor.value.setEditable(true);
      }

      title.value = response.document.title;

      // 如果是分享文档，将其添加到文档列表中以便在左侧显示
      if (
        isSharedDoc &&
        documents.value.findIndex((doc) => doc.id == response.document.id) ===
          -1
      ) {
        documents.value.unshift({
          id: response.document.id,
          title: response.document.title,
          content: response.document.content,
          created_at: response.document.created_at,
          updated_at: response.document.updated_at,
        });
      }

      // 加载文档评论
      try {
        const commentsResponse = await request.get(
          `/document/comment/document/${currentDocId}`
        );
        if (commentsResponse.code == 200) {
          comments.value = commentsResponse.comments || [];
          console.log("加载评论成功:", comments.value.length, "条评论");

          // 如果有评论，为每条评论添加标记
          if (comments.value.length > 0 && editor.value) {
            comments.value.forEach((comment) => {
              const { from, to } = comment.range;
              editor.value
                .chain()
                .setTextSelection({ from, to })
                .setMark("comment", {
                  commentId: comment.id,
                  commentData: comment,
                })
                .run();
            });
            // 重置选区
            editor.value.chain().focus().run();
          }
        } else {
          console.warn("获取评论失败:", commentsResponse?.message);
          comments.value = [];
        }
      } catch (error) {
        console.error("加载评论错误:", error);
        comments.value = [];
      }
    } else {
      console.error("获取文档内容失败:", response?.message);
      // 设置默认内容
      editor.value.commands.setContent(
        "<h1>文档加载失败</h1><p>无法加载文档内容，请检查网络连接或刷新页面重试。</p>"
      );
      title.value = "文档加载失败";
      ElMessage.error(response?.message || "无法加载文档内容");
    }
  } catch (error) {
    console.error("文档加载错误:", error);
    ElMessage.error(error.message || "加载文档时发生错误");
    // 设置默认内容
    editor.value.commands.setContent(
      "<h1>文档加载失败</h1><p>发生错误: " +
        (error.message || "未知错误") +
        "</p>"
    );
    title.value = "文档加载失败";
  } finally {
    NProgress.done();
  }
};

// 处理文档点击
const handleDocClick = (id) => {
  router.push({ name: "edit", params: { id: id } });
  // loadDocuments();
};

// 文心助手
const InsertErnie = (prompt) => {
  editor.value
    .chain()
    .focus()
    .insertContent(`<vue-component message="${prompt}" />`)
    .run();
  editor.value.chain().blur().run();
};

// 处理评论添加
const handleCommentAdded = async (comment) => {
  try {
    // 获取当前文档ID
    const currentDocId = router.currentRoute.value.params.id;

    // 如果是新文档（ID以new-doc-开头），先保存文档获取真实ID
    let documentId = currentDocId;
    if (currentDocId.toString().startsWith("new-doc-")) {
      const saveResponse = await request.post("/document", {
        title: title.value,
        content: editor.value.getHTML(),
      });

      if (saveResponse.code === "200") {
        documentId = saveResponse.id;
        // 更新路由到新的文档ID
        router.replace({ name: "edit", params: { id: documentId } });
      } else {
        ElMessage.error("保存文档失败，无法添加评论");
        return;
      }
    }

    // 准备评论数据
    const commentData = {
      ...comment,
      document_id: parseInt(documentId),
      selected_text: comment.selectedText, // 添加selected_text字段，后端API需要
      range_from: comment.range.from, // 直接使用range_from和range_to字段，与后端数据库字段对应
      range_to: comment.range.to,
      range: {
        from: comment.range.from,
        to: comment.range.to,
      },
    };

    // 发送到后端
    const response = await request.post("/document/comment", commentData);

    if (response.code === "200") {
      // 添加到本地评论列表
      comments.value.push(comment);
      ElMessage.success("评论添加成功");
    } else {
      ElMessage.error(response.message || "评论添加失败");
    }
  } catch (error) {
    console.error("添加评论错误:", error);
    ElMessage.error(error.message || "添加评论时发生错误");
  }
};

// 删除评论
const deleteComment = async (commentId) => {
  try {
    // 找到要删除的评论
    const commentIndex = comments.value.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return;

    const comment = comments.value[commentIndex];

    // 调用后端API删除评论
    const response = await request.delete(`/document/comment/${commentId}`);

    if (response.code === "200") {
      // 从评论数组中移除
      comments.value.splice(commentIndex, 1);

      // 如果编辑器存在，移除对应的评论标记
      if (editor.value) {
        const { from, to } = comment.range;
        editor.value
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .unsetMark("comment")
          .run();
      }

      // 如果没有评论了，隐藏评论列表
      if (comments.value.length === 0) {
        showCommentList.value = false;
      }

      ElMessage.success("评论删除成功");
    } else {
      ElMessage.error(response.message || "评论删除失败");
    }
  } catch (error) {
    console.error("删除评论错误:", error);
    ElMessage.error(error.message || "删除评论时发生错误");
  }
};

// 跳转到评论位置
const goToComment = (comment) => {
  if (!editor.value) return;

  const { from, to } = comment.range;

  // 设置选区并滚动到可见区域
  editor.value.chain().focus().setTextSelection({ from, to }).run();

  // 高亮显示评论文本
  const selection = { from, to };
  editor.value
    .chain()
    .setTextSelection(selection)
    .setHighlight({ color: "#dedcff" }) // 设置临时高亮
    .run();

  // 在短暂延迟后移除高亮
  setTimeout(() => {
    if (editor.value) {
      editor.value
        .chain()
        .setTextSelection(selection)
        .unsetHighlight() // 移除高亮
        .run();
    }
  }, 800);
};

// 切换评论列表显示
const toggleCommentList = () => {
  showCommentList.value = !showCommentList.value;
};

// 处理版本恢复
const handleVersionRestored = (version) => {
  console.log("版本已恢复:", version);
  // 重新加载文档数据
  loadDocuments();
};

// 自动保存版本
const autoSaveVersion = async () => {
  if (!editor.value) return;

  const currentContent = editor.value.getHTML();

  // 如果内容没有变化，不创建版本
  if (currentContent === lastSavedContent.value) {
    return;
  }

  try {
    const documentId = router.currentRoute.value.params.id;

    // 跳过新文档（ID以new-doc-开头）
    if (documentId.toString().startsWith("new-doc-")) {
      return;
    }

    // 创建自动保存版本
    if (documentHistoryRef.value) {
      const success = await documentHistoryRef.value.createVersion("自动保存");
      if (success) {
        lastSavedContent.value = currentContent;
        console.log("自动保存版本创建成功");
      }
    }
  } catch (error) {
    console.warn("自动保存版本失败:", error);
  }
};

// 启动自动保存
const startAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
  }

  autoSaveTimer.value = setInterval(autoSaveVersion, AUTO_SAVE_INTERVAL);
};

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
};

// 监听评论点击事件
const handleCommentClick = (event) => {
  const { comment } = event.detail;
  if (comment) {
    // 显示评论列表
    showCommentList.value = true;

    // 高亮显示被点击的评论文本
    if (editor.value) {
      const { from, to } = comment.range;
      // 设置选区并滚动到可见区域
      editor.value.chain().focus().setTextSelection({ from, to }).run();

      // 高亮显示评论文本
      const selection = { from, to };
      editor.value
        .chain()
        .setTextSelection(selection)
        .setHighlight({ color: "#fff8c5" }) // 设置临时高亮
        .run();

      // 在短暂延迟后移除高亮
      setTimeout(() => {
        if (editor.value) {
          editor.value
            .chain()
            .setTextSelection(selection)
            .unsetHighlight() // 移除高亮
            .run();
        }
      }, 1500);
    }

    // 高亮显示评论列表中的对应评论
    setTimeout(() => {
      const commentListItem = document.querySelector(
        `.comment-item[data-comment-id="${comment.id}"]`
      );
      if (commentListItem) {
        commentListItem.scrollIntoView({ behavior: "smooth", block: "center" });
        commentListItem.classList.add("highlight-comment");
        setTimeout(() => {
          commentListItem.classList.remove("highlight-comment");
        }, 1500);
      }
    }, 100);
  }
};

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadDocuments();
    }
  },
  { immediate: true } // 立即执行一次，确保首次进入页面时加载数据
);

// 监听用户信息变化，动态更新协同光标
watch(
  () => userStore.username,
  (newUsername) => {
    if (editor.value && newUsername) {
      editor.value.commands.updateUser({
        name: newUsername,
        color: generateUserColor(newUsername),
      });
    }
  }
);
// 添加评论点击事件监听
onMounted(() => {
  // 监听评论点击事件
  const editorContent = document.getElementById("editor-content");
  if (editorContent) {
    editorContent.addEventListener("comment-clicked", handleCommentClick);
  }

  // 启动自动保存
  startAutoSave();
});

// 销毁编辑器和移除事件监听
onBeforeUnmount(() => {
  // 移除评论点击事件监听
  const editorContent = document.getElementById("editor-content");
  if (editorContent) {
    editorContent.removeEventListener("comment-clicked", handleCommentClick);
  }

  // 停止自动保存
  stopAutoSave();

  // 销毁编辑器
  editor.value?.destroy();
});
</script>

<style scoped>
.container {
  height: 100vh;
  background-color: var(--nav--color) !important;
}

.header {
  height: 6vh;
  box-shadow: 0 0 2rem 0 rgba(41, 48, 66, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--nav--color);
  color: #606266;
}

.icon {
  padding: 2px 3px;
  margin: 0 4px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: transparent;
}

.main {
  padding: 1vh;
  overflow-y: hidden;
  position: relative;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slider {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  width: 50%;
  background-color: var(--el-color-primary);
  transition: transform 0.3s ease;
}

.title.outline-active .slider {
  transform: translateX(100%);
}

/* 评论相关样式 */
.comment-list-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-height: 70vh;
  overflow-y: auto;
}

.comment-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 900;
  border-radius: 20px;
  padding: 8px 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 评论高亮样式 */
.highlight-comment {
  animation: pulse-highlight 1.5s ease-in-out;
}

@keyframes pulse-highlight {
  0% {
    background-color: rgba(255, 230, 0, 0.2);
  }
  50% {
    background-color: rgba(255, 230, 0, 0.5);
  }
  100% {
    background-color: rgba(255, 230, 0, 0.2);
  }
}

/* 评论标记样式 */
:deep(span[data-comment-id]) {
  background-color: rgba(255, 230, 0, 0.2);
  border-bottom: 2px solid #ffcc00;
  cursor: pointer;
  padding: 2px 0;
}

:deep(span[data-comment-id]:hover) {
  background-color: rgba(255, 230, 0, 0.4);
}
</style>
