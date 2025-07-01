<template>
  <div class="comment-panel" v-if="isVisible">
    <div class="comment-header">
      <h3>评论</h3>
      <el-button type="text" @click="closePanel" class="close-btn">
        <i class="ri-close-line"></i>
      </el-button>
    </div>
    <div class="comment-content">
      <div class="selected-text" v-if="selectedText">
        <p>"{{ selectedText }}"</p>
      </div>
      <el-input
        v-model="commentText"
        type="textarea"
        :rows="3"
        placeholder="添加评论..."
        resize="none"
      />
    </div>
    <div class="comment-footer">
      <el-button @click="closePanel">取消</el-button>
      <el-button type="primary" @click="addComment" :disabled="!commentText.trim()">添加</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { ElButton, ElInput } from 'element-plus';

const props = defineProps({
  editor: Object,
  isVisible: Boolean,
  selectedText: String,
  position: Object,
});

const emit = defineEmits(['close', 'add-comment']);

const commentText = ref('');

const closePanel = () => {
  commentText.value = '';
  emit('close');
};

const addComment = () => {
  if (!commentText.value.trim()) return;
  
  emit('add-comment', {
    text: commentText.value,
    timestamp: new Date().toISOString(),
    user: {
      name: '当前用户', // 这里可以从用户状态获取真实用户名
      id: '1', // 这里可以从用户状态获取真实用户ID
    },
  });
  
  commentText.value = '';
  closePanel();
};
</script>

<style scoped>
.comment-panel {
  position: absolute;
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e4e7ed;
}

.comment-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  padding: 2px;
}

.comment-content {
  padding: 15px;
  flex-grow: 1;
}

.selected-text {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-style: italic;
  color: #606266;
  max-height: 80px;
  overflow-y: auto;
}

.selected-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 15px;
  border-top: 1px solid #e4e7ed;
  gap: 10px;
}
</style>