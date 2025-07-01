<template>
  <div class="comment-list-container">
    <div class="comment-list-header">
      <h3>评论列表</h3>
      <el-button type="text" @click="$emit('close')" class="close-btn">
        <i class="ri-close-line"></i>
      </el-button>
    </div>
    <div class="comment-list" v-if="comments.length > 0">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-item-header">
          <div class="user-info">
            <div class="user-avatar" :style="{ backgroundColor: getUserColor(comment.user.name) }">
              {{ getUserInitial(comment.user.name) }}
            </div>
            <span class="user-name">{{ comment.user.name }}</span>
          </div>
          <span class="comment-date">{{ formatDate(comment.timestamp) }}</span>
        </div>
        <div class="comment-text">{{ comment.text }}</div>
        <div class="comment-actions">
          <el-button type="text" size="small" @click="goToComment(comment)">
            <i class="ri-arrow-right-line"></i> 跳转
          </el-button>
          <el-button type="text" size="small" @click="deleteComment(comment.id)">
            <i class="ri-delete-bin-line"></i> 删除
          </el-button>
        </div>
        <div class="comment-context" v-if="comment.selectedText">
          <p>"{{ comment.selectedText }}"</p>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <i class="ri-chat-3-line"></i>
      <p>暂无评论</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { ElButton } from 'element-plus';

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  editor: Object,
});

const emit = defineEmits(['close', 'delete-comment', 'go-to-comment']);

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 获取用户头像的首字母
const getUserInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

// 生成用户颜色
const getUserColor = (username) => {
  if (!username) return '#f783ac';

  // 基于用户名生成一致的颜色
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 生成明亮且对比度好的颜色
  const colors = [
    '#f783ac',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
  ];

  return colors[Math.abs(hash) % colors.length];
};

// 跳转到评论位置
const goToComment = (comment) => {
  emit('go-to-comment', comment);
};

// 删除评论
const deleteComment = (commentId) => {
  emit('delete-comment', commentId);
};
</script>

<style scoped>
.comment-list-container {
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 500px;
  border: 1px solid #e4e7ed;
}

.comment-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e4e7ed;
}

.comment-list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  padding: 2px;
}

.comment-list {
  overflow-y: auto;
  padding: 0;
  flex-grow: 1;
  max-height: 450px;
}

.comment-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.comment-context {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-style: italic;
  color: #606266;
  font-size: 13px;
}

.comment-context p {
  margin: 0;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>