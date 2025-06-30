<template>
    <div class="recent-access-component">
        <h3 class="title">最近访问</h3>
        <div v-if="recentDocuments.length === 0" class="empty-state">
            <el-empty description="暂无最近访问记录" />
        </div>
        <div v-else class="document-list">
            <div v-for="(doc, index) in displayedDocuments" :key="index" class="document-item"
                @click="openDocument(doc.id)">
                <div class="doc-icon">
                    <i class="ri-file-text-line"></i>
                </div>
                <div class="doc-info">
                    <div class="doc-title">{{ doc.title }}</div>
                    <div class="doc-time">{{ doc.accessTime }}</div>
                </div>
            </div>
            <div v-if="recentDocuments.length > 3 && !showAll" class="view-more" @click="toggleShowAll">
                <span>查看更多</span>
                <i class="ri-arrow-down-s-line"></i>
            </div>
            <div v-if="showAll && recentDocuments.length > 3" class="view-more" @click="toggleShowAll">
                <span>收起</span>
                <i class="ri-arrow-up-s-line"></i>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';

const router = useRouter();
const knowledgeBaseStore = useKnowledgeBaseStore();
const showAll = ref(false);

// 获取最近访问文档
const recentDocuments = computed(() => knowledgeBaseStore.getRecentAccessDocs);

// 显示的文档（默认前3条，点击更多后显示全部）
const displayedDocuments = computed(() => {
    return showAll.value ? recentDocuments.value : recentDocuments.value.slice(0, 3);
});

// 切换显示全部/部分
const toggleShowAll = () => {
    showAll.value = !showAll.value;
};

// 打开文档
const openDocument = (docId) => {
    router.push({ name: 'edit', params: { id: docId } });
};
</script>

<style scoped>
.recent-access-component {
    background-color: #fff;
    border-radius: 4px;
    padding: 16px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.title {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #303133;
}

.empty-state {
    padding: 20px 0;
}

.document-list {
    display: flex;
    flex-direction: column;
}

.document-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
    transition: all 0.3s;
}

.document-item:last-child {
    border-bottom: none;
}

.document-item:hover {
    background-color: #f5f7fa;
}

.doc-icon {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background-color: #ecf5ff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 12px;
}

.doc-icon i {
    font-size: 18px;
    color: var(--el-color-primary);
}

.doc-info {
    flex: 1;
}

.doc-title {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
}

.doc-time {
    font-size: 12px;
    color: #909399;
}

.view-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
    color: var(--el-color-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    border-top: 1px dashed #ebeef5;
    margin-top: 5px;
}

.view-more:hover {
    background-color: #f5f7fa;
}

.view-more i {
    margin-left: 4px;
    font-size: 16px;
}
</style>