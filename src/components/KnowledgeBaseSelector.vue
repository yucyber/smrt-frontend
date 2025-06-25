<template>
    <div class="knowledge-base-selector">
        <el-popover trigger="click" width="300" :visible="visible" @hide="visible = false">
            <template #reference>
                <el-button size="small" type="primary">
                    <i class="ri-book-2-line"></i>
                    知识库
                    <span v-if="associatedKnowledgeBases.length > 0" class="kb-count">{{ associatedKnowledgeBases.length
                    }}</span>
                </el-button>
            </template>
            <div class="popover-content">
                <h3>选择知识库</h3>
                <div class="search-box">
                    <el-input v-model="searchQuery" placeholder="搜索知识库..." size="small" clearable>
                        <template #prefix>
                            <i class="ri-search-line"></i>
                        </template>
                    </el-input>
                </div>
                <div class="kb-list">
                    <div v-if="filteredKnowledgeBases.length === 0" class="empty-state">
                        暂无知识库
                    </div>
                    <el-checkbox-group v-model="selectedKnowledgeBases">
                        <div v-for="kb in filteredKnowledgeBases" :key="kb.id" class="kb-item">
                            <el-checkbox :label="kb.id">
                                <div class="kb-info">
                                    <div class="kb-name">
                                        <i :class="kb.icon"></i> {{ kb.name }}
                                    </div>
                                    <div class="kb-desc">{{ kb.description }}</div>
                                </div>
                            </el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <div class="actions">
                    <el-button size="small" @click="visible = false">取消</el-button>
                    <el-button size="small" type="primary" @click="saveAssociations">保存</el-button>
                </div>
            </div>
        </el-popover>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElButton, ElPopover, ElCheckbox, ElCheckboxGroup, ElInput, ElMessage } from 'element-plus';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';

const props = defineProps({
    documentId: {
        type: String,
        required: true,
        validator: (value) => {
            // 验证documentId是否为有效值
            return value && value.trim() !== '';
        }
    }
});

const knowledgeBaseStore = useKnowledgeBaseStore();
const visible = ref(false);
const searchQuery = ref('');
const selectedKnowledgeBases = ref([]);
const isDocumentValid = ref(true);

// 获取所有知识库
const allKnowledgeBases = computed(() => knowledgeBaseStore.getKnowledgeBases);

// 过滤知识库列表
const filteredKnowledgeBases = computed(() => {
    if (!searchQuery.value) {
        return allKnowledgeBases.value;
    }
    return allKnowledgeBases.value.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        kb.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// 当前文档关联的知识库
const associatedKnowledgeBases = computed(() => {
    if (!isDocumentValid.value || !props.documentId) {
        return [];
    }

    // 从文档关联数据中获取当前文档关联的知识库ID列表
    const associations = knowledgeBaseStore.documentAssociations;
    const kbIds = associations[props.documentId] || [];

    // 获取关联知识库的详细信息
    return allKnowledgeBases.value.filter(kb => kbIds.includes(kb.id));
});

// 验证当前文档是否有效
const validateDocument = () => {
    // 检查documentId是否存在于最近访问记录中
    const recentDocs = knowledgeBaseStore.getRecentAccessDocs;
    const isInRecent = recentDocs.some(doc => doc.id === props.documentId);

    // 如果在最近记录中找到，则文档有效
    isDocumentValid.value = isInRecent;

    // 如果是新文档（ID以new-doc开头），也认为是有效的
    if (props.documentId.toString().startsWith('new-doc-')) {
        isDocumentValid.value = true;
    }

    return isDocumentValid.value;
};

// 保存知识库关联
const saveAssociations = () => {
    if (!validateDocument()) {
        ElMessage.error('无法关联知识库：文档不存在或已删除');
        visible.value = false;
        return;
    }

    // 找出所有需要添加的知识库
    selectedKnowledgeBases.value.forEach(kbId => {
        if (!associatedKnowledgeBases.value.some(kb => kb.id === kbId)) {
            knowledgeBaseStore.addDocumentsToKnowledgeBase(kbId, [props.documentId]);
        }
    });

    // 找出所有需要移除的知识库
    associatedKnowledgeBases.value.forEach(kb => {
        if (!selectedKnowledgeBases.value.includes(kb.id)) {
            knowledgeBaseStore.removeDocumentFromKnowledgeBase(kb.id, props.documentId);
        }
    });

    ElMessage.success('知识库关联已更新');
    visible.value = false;
};

// 当弹窗显示时，初始化选中状态
watch(visible, (isVisible) => {
    if (isVisible) {
        // 验证文档是否有效
        if (!validateDocument()) {
            ElMessage.warning('当前文档可能已被删除，请先保存');
        }

        // 设置已关联的知识库为选中状态
        selectedKnowledgeBases.value = associatedKnowledgeBases.value.map(kb => kb.id);
    }
});

// 初始化
onMounted(() => {
    // 验证文档是否有效
    validateDocument();

    // 当组件挂载时，初始化选中的知识库
    selectedKnowledgeBases.value = associatedKnowledgeBases.value.map(kb => kb.id);
});
</script>

<style scoped>
.knowledge-base-selector {
    display: inline-block;
}

.kb-count {
    display: inline-block;
    background-color: var(--el-color-danger);
    color: white;
    border-radius: 10px;
    padding: 0 6px;
    font-size: 12px;
    margin-left: 5px;
    line-height: 16px;
    height: 16px;
    vertical-align: middle;
}

.popover-content {
    padding: 10px 0;
}

.popover-content h3 {
    margin: 0 0 10px 0;
    padding: 0 10px;
    font-size: 16px;
    color: var(--el-text-color-primary);
}

.search-box {
    padding: 0 10px 10px;
}

.kb-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 0 10px;
    margin-bottom: 10px;
}

.kb-item {
    padding: 5px 0;
    border-bottom: 1px solid #f0f0f0;
}

.kb-item:last-child {
    border-bottom: none;
}

.kb-info {
    margin-left: 5px;
}

.kb-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.kb-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.actions {
    display: flex;
    justify-content: flex-end;
    padding: 10px;
    border-top: 1px solid #f0f0f0;
}

.empty-state {
    padding: 20px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
}
</style>