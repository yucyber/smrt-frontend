<template>
  <div class="document-history">
    <!-- 历史版本按钮 -->
    <el-button 
      class="history-toggle-btn" 
      type="primary" 
      size="small" 
      @click="toggleHistoryPanel"
    >
      <i class="ri-history-line"></i>
      历史版本
    </el-button>

    <!-- 历史版本面板 -->
    <el-drawer
      v-model="showHistoryPanel"
      title="文档历史版本"
      direction="rtl"
      size="400px"
      :before-close="handleClose"
    >
      <div class="history-content">
        <!-- 版本列表 -->
        <div class="version-list">
          <div 
            v-for="version in versions" 
            :key="version.id"
            class="version-item"
            :class="{ 'current-version': version.is_current }"
            @click="selectVersion(version)"
          >
            <div class="version-info">
              <div class="version-title">
                <span class="version-number">版本 {{ version.version_number }}</span>
                <el-tag v-if="version.is_current" type="success" size="small">当前版本</el-tag>
              </div>
              <div class="version-meta">
                <span class="save-time">{{ formatTime(version.created_at) }}</span>
                <span class="author">{{ version.author || '未知用户' }}</span>
              </div>
              <div class="version-summary" v-if="version.summary">
                {{ version.summary }}
              </div>
            </div>
            <div class="version-actions">
              <el-button 
                size="small" 
                type="text" 
                @click.stop="previewVersion(version)"
              >
                预览
              </el-button>
              <el-button 
                v-if="!version.is_current"
                size="small" 
                type="text" 
                @click.stop="restoreVersion(version)"
              >
                恢复
              </el-button>
              <el-button 
                v-if="!version.is_current"
                size="small" 
                type="text" 
                @click.stop="compareVersion(version)"
              >
                对比
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="versions.length === 0" class="empty-state">
          <i class="ri-history-line empty-icon"></i>
          <p>暂无历史版本</p>
          <p class="empty-tip">保存文档后将自动创建版本记录</p>
        </div>
      </div>
    </el-drawer>

    <!-- 版本预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="`预览版本 ${selectedVersion?.version_number}`"
      width="80%"
      top="5vh"
    >
      <div class="preview-content">
        <div class="preview-meta">
          <span>保存时间：{{ formatTime(selectedVersion?.created_at) }}</span>
          <span>作者：{{ selectedVersion?.author || '未知用户' }}</span>
        </div>
        <div class="preview-editor" v-html="selectedVersion?.content"></div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPreviewDialog = false">关闭</el-button>
          <el-button 
            v-if="!selectedVersion?.is_current"
            type="primary" 
            @click="restoreVersion(selectedVersion)"
          >
            恢复此版本
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="showCompareDialog"
      :title="`版本对比：当前版本 vs 版本 ${selectedVersion?.version_number}`"
      width="90%"
      top="5vh"
    >
      <div class="compare-content">
        <div class="compare-header">
          <div class="compare-column">
            <h4>当前版本</h4>
            <p>{{ formatTime(currentVersion?.created_at) }}</p>
          </div>
          <div class="compare-column">
            <h4>版本 {{ selectedVersion?.version_number }}</h4>
            <p>{{ formatTime(selectedVersion?.created_at) }}</p>
          </div>
        </div>
        <div class="compare-body">
          <div class="compare-column">
            <div class="compare-editor" v-html="currentVersion?.content"></div>
          </div>
          <div class="compare-column">
            <div class="compare-editor" v-html="selectedVersion?.content"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCompareDialog = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="restoreVersion(selectedVersion)"
          >
            恢复到版本 {{ selectedVersion?.version_number }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'
import { useRoute } from 'vue-router'
import { mockVersionAPI, initMockData } from '../utils/mockVersionAPI.js'

const props = defineProps({
  editor: Object,
  documentId: [String, Number]
})

const emit = defineEmits(['version-restored'])

const route = useRoute()
const showHistoryPanel = ref(false)
const showPreviewDialog = ref(false)
const showCompareDialog = ref(false)
const versions = ref([])
const selectedVersion = ref(null)
const loading = ref(false)

// 当前版本（用于对比）
const currentVersion = computed(() => {
  return versions.value.find(v => v.is_current) || {
    content: props.editor?.getHTML() || '',
    created_at: new Date().toISOString(),
    author: '当前用户'
  }
})

// 切换历史版本面板
const toggleHistoryPanel = () => {
  showHistoryPanel.value = !showHistoryPanel.value
  if (showHistoryPanel.value) {
    loadVersions()
  }
}

// 关闭面板
const handleClose = () => {
  showHistoryPanel.value = false
}

// 加载版本列表
const loadVersions = async () => {
  try {
    loading.value = true
    const documentId = props.documentId || route.params.id
    
    console.log('加载版本列表 - 文档ID:', documentId)
    
    // 初始化mock数据
    initMockData(documentId)
    
    // 尝试使用真实API，如果失败则使用mock API
    let response
    try {
      response = await request.get(`/document/${documentId}/versions`)
      console.log('版本列表API响应:', response)
    } catch (apiError) {
      console.warn('真实API不可用，使用mock数据:', apiError)
      response = await mockVersionAPI.getVersions(documentId)
    }
    
    if (response.code === '200') {
      versions.value = response.versions || []
      console.log('加载到的版本数量:', versions.value.length)
      if (versions.value.length > 0) {
        console.log('第一个版本内容长度:', versions.value[0].content?.length || 0)
        console.log('第一个版本内容预览:', versions.value[0].content?.substring(0, 100) || '无内容')
      }
    } else {
      ElMessage.error(response.message || '加载历史版本失败')
    }
  } catch (error) {
    console.error('加载版本列表错误:', error)
    ElMessage.error('加载历史版本时发生错误')
  } finally {
    loading.value = false
  }
}

// 选择版本
const selectVersion = (version) => {
  selectedVersion.value = version
}

// 预览版本
const previewVersion = (version) => {
  selectedVersion.value = version
  showPreviewDialog.value = true
}

// 对比版本
const compareVersion = (version) => {
  selectedVersion.value = version
  showCompareDialog.value = true
}

// 恢复版本
const restoreVersion = async (version) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要恢复到版本 ${version.version_number} 吗？当前的修改将会丢失。`,
      '确认恢复版本',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (result === 'confirm') {
      const documentId = props.documentId || route.params.id
      
      // 尝试使用真实API，如果失败则使用mock API
      let response
      try {
        response = await request.post(`/document/${documentId}/restore`, {
          version_id: version.id
        })
      } catch (apiError) {
        console.warn('真实API不可用，使用mock数据:', apiError)
        response = await mockVersionAPI.restoreVersion(documentId, version.id)
      }
      
      if (response.code === '200') {
        ElMessage.success('版本恢复成功')
        
        // 更新编辑器内容
        if (props.editor) {
          props.editor.commands.setContent(version.content)
        }
        
        // 关闭对话框
        showPreviewDialog.value = false
        showCompareDialog.value = false
        
        // 重新加载版本列表
        await loadVersions()
        
        // 通知父组件
        emit('version-restored', version)
      } else {
        ElMessage.error(response.message || '版本恢复失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复版本错误:', error)
      ElMessage.error('恢复版本时发生错误')
    }
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '未知时间'
  
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }
  
  // 超过7天显示具体日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 暴露方法给父组件
defineExpose({
  loadVersions,
  createVersion: async (summary = '') => {
    try {
      const documentId = props.documentId || route.params.id
      const content = props.editor?.getHTML() || ''
      
      // 调试信息
      console.log('创建版本 - 文档ID:', documentId)
      console.log('创建版本 - 内容长度:', content.length)
      console.log('创建版本 - 内容预览:', content.substring(0, 100))
      
      if (!content || content.trim() === '') {
        console.warn('版本内容为空，跳过创建')
        return false
      }
      
      // 尝试使用真实API，如果失败则使用mock API
      let response
      try {
        response = await request.post(`/document/${documentId}/versions`, {
          content,
          summary
        })
        console.log('创建版本API响应:', response)
      } catch (apiError) {
        console.warn('真实API不可用，使用mock数据:', apiError)
        response = await mockVersionAPI.createVersion(documentId, content, summary)
      }
      
      if (response.code === '200') {
        console.log('版本创建成功')
        // 重新加载版本列表
        if (showHistoryPanel.value) {
          await loadVersions()
        }
        return true
      } else {
        console.error('创建版本失败:', response.message)
        return false
      }
    } catch (error) {
      console.error('创建版本错误:', error)
      return false
    }
  }
})
</script>

<style scoped>
.document-history {
  position: relative;
}

.history-toggle-btn {
  position: fixed;
  top: 170px;
  right: 20px;
  z-index: 1000;
  border-radius: 20px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.version-list {
  flex: 1;
  overflow-y: auto;
}

.version-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.version-item:hover {
  background-color: #f8f9fa;
}

.version-item.current-version {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.version-info {
  margin-bottom: 8px;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-number {
  font-weight: 600;
  color: #303133;
}

.version-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.version-summary {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.empty-tip {
  font-size: 12px;
  margin-top: 8px;
}

.preview-content {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-meta {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

.preview-editor {
  min-height: 400px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fafafa;
}

.compare-content {
  max-height: 70vh;
  overflow-y: auto;
}

.compare-header {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.compare-body {
  display: flex;
  gap: 16px;
}

.compare-column {
  flex: 1;
}

.compare-column h4 {
  margin: 0 0 8px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px 4px 0 0;
}

.compare-column p {
  margin: 0;
  padding: 0 12px 12px 12px;
  font-size: 12px;
  color: #909399;
}

.compare-editor {
  min-height: 400px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fafafa;
  font-size: 14px;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-toggle-btn {
    right: 10px;
    top: 100px;
  }
  
  .compare-body {
    flex-direction: column;
  }
}
</style>