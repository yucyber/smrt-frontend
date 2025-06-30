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
const loading = ref(false);

// 初始化
onMounted(async () => {
    if (props.documentId) {
        try {
            await loadAssociations();
        } catch (error) {
            console.error('加载知识库关联失败:', error);
        }
    }
});

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

// 监听popover显示状态，显示时加载最新的知识库数据
watch(visible, async (newValue) => {
    if (newValue) {
        loading.value = true;
        try {
            // 确保加载最新的知识库数据
            await knowledgeBaseStore.loadAllData();
            await loadAssociations();
        } catch (error) {
            console.error('加载知识库数据失败:', error);
        } finally {
            loading.value = false;
        }
    }
});

// 加载当前文档的知识库关联
const loadAssociations = async () => {
    if (!props.documentId) {
        console.warn('无效的文档ID');
        return;
    }

    isDocumentValid.value = true;

    // 获取当前文档关联的知识库ID
    const associations = knowledgeBaseStore.documentAssociations;
    selectedKnowledgeBases.value = associations[props.documentId] || [];
};

// 保存关联
const saveAssociations = async () => {
    if (!props.documentId) {
        ElMessage.warning('无效的文档ID');
        return;
    }

    loading.value = true;
    try {
        const currentAssociations = knowledgeBaseStore.documentAssociations[props.documentId] || [];

        // 找出需要添加的知识库
        const toAdd = selectedKnowledgeBases.value.filter(id => !currentAssociations.includes(id));

        // 找出需要移除的知识库
        const toRemove = currentAssociations.filter(id => !selectedKnowledgeBases.value.includes(id));

        // 执行添加操作
        for (const kbId of toAdd) {
            await knowledgeBaseStore.addDocumentToKnowledgeBase(kbId, props.documentId);
        }

        // 执行移除操作
        for (const kbId of toRemove) {
            await knowledgeBaseStore.removeDocumentFromKnowledgeBase(kbId, props.documentId);
        }

        visible.value = false;

        if (toAdd.length > 0 || toRemove.length > 0) {
            ElMessage.success('知识库关联已更新');
        }
    } catch (error) {
        console.error('更新知识库关联失败:', error);
        ElMessage.error('更新知识库关联失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};
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