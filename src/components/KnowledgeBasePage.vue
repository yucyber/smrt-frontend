<template>
    <div class="knowledge-base-container">
        <div class="page-header">
            <h1>
                <template v-if="knowledgeBaseId">{{ currentKnowledgeBase?.name || '知识库详情' }}</template>
                <template v-else>我的知识库</template>
            </h1>
            <el-button type="primary" @click="createKnowledgeBase">
                <i class="ri-add-line"></i> 创建知识库
            </el-button>
        </div>

        <!-- 知识库列表视图 -->
        <div class="knowledge-base-content" v-if="!knowledgeBaseId">
            <el-row :gutter="20">
                <el-col :span="8" v-for="kb in knowledgeBases" :key="kb.id">
                    <el-card class="kb-card" @click="openKnowledgeBase(kb.id)">
                        <div class="kb-icon">
                            <i :class="kb.icon"></i>
                        </div>
                        <div class="kb-info">
                            <h3>{{ kb.name }}</h3>
                            <p>{{ kb.description }}</p>
                            <div class="kb-meta">
                                <span>{{ kb.docCount }}个文档</span>
                                <span>{{ kb.lastUpdated }}</span>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 知识库详情视图 -->
        <div class="knowledge-base-detail" v-else>
            <el-tabs type="card">
                <el-tab-pane label="文档">
                    <div class="doc-actions">
                        <el-button type="primary" size="small" @click="openAddDocDialog">
                            <i class="ri-add-line"></i> 添加文档
                        </el-button>
                    </div>

                    <el-table :data="documents" style="width: 100%" v-if="documents.length > 0">
                        <el-table-column prop="title" label="文档名称">
                            <template #default="scope">
                                <div class="doc-title" @click="editDocument(scope.row.id)">
                                    {{ scope.row.title }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="createTime" label="创建时间" width="180" />
                        <el-table-column prop="updateTime" label="更新时间" width="180" />
                        <el-table-column fixed="right" label="操作" width="120">
                            <template #default="scope">
                                <el-button link type="primary" size="small"
                                    @click="editDocument(scope.row.id)">编辑</el-button>
                                <el-button link type="danger" size="small"
                                    @click="removeDocument(scope.row.id)">移除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div class="empty-docs" v-else>
                        <el-empty description="当前知识库还没有任何文档" />
                        <el-button type="primary" @click="showAddDocDialog = true">添加文档</el-button>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="设置">
                    <el-form :model="knowledgeBaseForm" label-width="120px">
                        <el-form-item label="知识库名称">
                            <el-input v-model="knowledgeBaseForm.name" />
                        </el-form-item>
                        <el-form-item label="知识库描述">
                            <el-input v-model="knowledgeBaseForm.description" type="textarea" />
                        </el-form-item>
                        <el-form-item label="图标">
                            <el-select v-model="knowledgeBaseForm.icon">
                                <el-option label="书籍" value="ri-book-2-line" />
                                <el-option label="项目" value="ri-folder-2-line" />
                                <el-option label="笔记" value="ri-sticky-note-line" />
                                <el-option label="工作" value="ri-briefcase-line" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="saveKnowledgeBase">保存</el-button>
                            <el-button type="danger" @click="confirmDeleteKnowledgeBase">删除知识库</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- 添加文档对话框 -->
        <el-dialog title="添加文档到知识库" v-model="showAddDocDialog" width="600px">
            <div v-if="filteredDocumentsForDialog.length === 0" class="empty-docs-dialog">
                <el-empty description="没有可添加的文档" />
            </div>
            <el-table v-else :data="filteredDocumentsForDialog" style="width: 100%" height="350px"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="title" label="文档名称" />
                <el-table-column prop="updateTime" label="更新时间" width="180" />
            </el-table>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showAddDocDialog = false">取消</el-button>
                    <el-button type="primary" @click="addDocumentsToKnowledgeBase">确认</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 确认删除对话框 -->
        <el-dialog title="确认删除" v-model="showDeleteConfirmDialog" width="30%">
            <span>确认删除该知识库？删除后将无法恢复。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showDeleteConfirmDialog = false">取消</el-button>
                    <el-button type="danger" @click="deleteKnowledgeBase">确认删除</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 新建知识库对话框 -->
        <el-dialog title="创建知识库" v-model="showCreateDialog" width="500px">
            <el-form :model="createForm" label-width="120px">
                <el-form-item label="知识库名称" required>
                    <el-input v-model="createForm.name" placeholder="请输入知识库名称" />
                </el-form-item>
                <el-form-item label="知识库描述">
                    <el-input v-model="createForm.description" type="textarea" placeholder="简要描述该知识库的用途" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-select v-model="createForm.icon" placeholder="选择知识库图标">
                        <el-option label="书籍" value="ri-book-2-line" />
                        <el-option label="项目" value="ri-folder-2-line" />
                        <el-option label="笔记" value="ri-sticky-note-line" />
                        <el-option label="工作" value="ri-briefcase-line" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showCreateDialog = false">取消</el-button>
                    <el-button type="primary" @click="submitCreateKnowledgeBase">创建</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';
import request from '../utils/request';

// 路由相关
const route = useRoute();
const router = useRouter();
const knowledgeBaseId = computed(() => route.params.id);

// Store
const knowledgeBaseStore = useKnowledgeBaseStore();

// 对话框控制
const showAddDocDialog = ref(false);
const showDeleteConfirmDialog = ref(false);
const showCreateDialog = ref(false);

// 表单数据
const knowledgeBaseForm = ref({
    name: '',
    description: '',
    icon: 'ri-book-2-line'
});

const createForm = ref({
    name: '',
    description: '',
    icon: 'ri-book-2-line'
});

// 知识库数据
const knowledgeBases = computed(() => knowledgeBaseStore.getKnowledgeBases);
const currentKnowledgeBase = ref({});

// 文档数据
const documents = ref([]);
const allDocuments = ref([]);
const selectedDocuments = ref([]);

// 过滤后的文档列表（用于对话框）
const filteredDocumentsForDialog = computed(() => {
    if (!knowledgeBaseId.value) return [];

    // 获取当前知识库已有的文档ID列表
    const existingDocIds = knowledgeBaseStore.getDocumentsInKnowledgeBase(knowledgeBaseId.value);

    // 过滤出尚未添加到当前知识库的文档
    return allDocuments.value.filter(doc => !existingDocIds.includes(doc.id));
});

// 监听路由参数变化
watch(() => route.params.id, async (newId) => {
    if (newId) {
        await loadKnowledgeBaseDetails(newId);
    }
}, { immediate: true });

// 打开知识库
const openKnowledgeBase = (id) => {
    router.push(`/dashboard/KnowledgeBasePage/${id}`);
};

// 编辑文档
const editDocument = (id) => {
    // 记录访问
    const doc = documents.value.find(doc => doc.id === id);
    if (doc) {
        knowledgeBaseStore.recordDocumentAccess(id, doc.title);
    }
    router.push({ name: 'edit', params: { id } });
};

// 处理选择文档
const handleSelectionChange = (val) => {
    selectedDocuments.value = val;
};

// 添加文档到知识库
const addDocumentsToKnowledgeBase = () => {
    if (selectedDocuments.value.length === 0) {
        ElMessage.warning('请至少选择一个文档');
        return;
    }

    // 获取当前知识库已有的文档ID列表
    const existingDocIds = knowledgeBaseStore.getDocumentsInKnowledgeBase(knowledgeBaseId.value);

    // 过滤出尚未添加到当前知识库的文档
    const newDocIds = selectedDocuments.value
        .map(doc => doc.id)
        .filter(id => !existingDocIds.includes(id));

    if (newDocIds.length === 0) {
        ElMessage.info('所选文档都已经在此知识库中');
        showAddDocDialog.value = false;
        return;
    }

    // 添加新文档到知识库
    knowledgeBaseStore.addDocumentsToKnowledgeBase(knowledgeBaseId.value, newDocIds);

    // 更新当前文档列表
    loadDocumentsForKnowledgeBase();
    showAddDocDialog.value = false;

    ElMessage.success(`成功添加${newDocIds.length}个文档到知识库`);
};

// 从知识库移除文档
const removeDocument = (docId) => {
    ElMessageBox.confirm(
        '确定要从此知识库中移除该文档吗？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        knowledgeBaseStore.removeDocumentFromKnowledgeBase(knowledgeBaseId.value, docId);
        loadDocumentsForKnowledgeBase(); // 重新加载文档列表
        ElMessage.success('文档已从知识库移除');
    }).catch(() => {
        // 取消操作
    });
};

// 保存知识库设置
const saveKnowledgeBase = () => {
    if (!knowledgeBaseForm.value.name) {
        ElMessage.warning('知识库名称不能为空');
        return;
    }

    knowledgeBaseStore.updateKnowledgeBase(knowledgeBaseId.value, knowledgeBaseForm.value);
    currentKnowledgeBase.value = knowledgeBaseStore.getKnowledgeBaseById(knowledgeBaseId.value);
    ElMessage.success('知识库设置已更新');
};

// 确认删除知识库
const confirmDeleteKnowledgeBase = () => {
    showDeleteConfirmDialog.value = true;
};

// 删除知识库
const deleteKnowledgeBase = () => {
    knowledgeBaseStore.deleteKnowledgeBase(knowledgeBaseId.value);
    showDeleteConfirmDialog.value = false;

    ElMessage.success('知识库已删除');
    router.push('/dashboard/KnowledgeBasePage');
};

// 创建知识库
const createKnowledgeBase = () => {
    createForm.value = {
        name: '',
        description: '',
        icon: 'ri-book-2-line'
    };
    showCreateDialog.value = true;
};

// 提交创建知识库
const submitCreateKnowledgeBase = () => {
    if (!createForm.value.name) {
        ElMessage.warning('知识库名称不能为空');
        return;
    }

    const newId = knowledgeBaseStore.createKnowledgeBase(createForm.value);
    showCreateDialog.value = false;

    ElMessage.success('知识库创建成功');
    router.push(`/dashboard/KnowledgeBasePage/${newId}`);
};

// 加载知识库详情
const loadKnowledgeBaseDetails = async (id) => {
    const kb = knowledgeBaseStore.getKnowledgeBaseById(id);
    if (kb) {
        currentKnowledgeBase.value = kb;
        knowledgeBaseForm.value = {
            name: kb.name,
            description: kb.description,
            icon: kb.icon
        };

        // 加载该知识库中的文档
        loadDocumentsForKnowledgeBase();
    }
};

// 加载知识库中的文档
const loadDocumentsForKnowledgeBase = async () => {
    try {
        const docIds = knowledgeBaseStore.getDocumentsInKnowledgeBase(knowledgeBaseId.value);
        documents.value = []; // 清空现有数据

        if (docIds.length === 0) {
            return; // 如果没有关联文档，直接返回空列表
        }

        // 使用Set跟踪已加载的文档ID，确保不会出现重复
        const loadedDocIds = new Set();
        // 记录成功加载的文档和失败的文档ID
        const failedDocIds = [];

        // 过滤掉测试文档'd1'
        const filteredDocIds = docIds.filter(docId => docId !== 'd1');

        // 尝试从后端获取文档详情
        for (const docId of filteredDocIds) {
            // 如果已经加载过该ID的文档，跳过
            if (loadedDocIds.has(docId)) {
                continue;
            }

            try {
                // 尝试通过API获取文档信息
                const response = await request.get(`/document/${docId}`);
                if (response && response.code === 200) {
                    documents.value.push({
                        id: docId,
                        title: response.document.title,
                        createTime: new Date(response.document.createTime).toLocaleDateString(),
                        updateTime: new Date(response.document.updateTime).toLocaleDateString()
                    });
                    loadedDocIds.add(docId);
                } else {
                    failedDocIds.push(docId);
                }
            } catch (error) {
                console.error(`获取文档 ${docId} 详情失败:`, error);
                failedDocIds.push(docId);
            }
        }

        // 如果有加载失败的文档，尝试从最近访问记录中找到对应信息
        if (failedDocIds.length > 0) {
            const recentDocs = knowledgeBaseStore.getRecentAccessDocs;

            // 从最近访问记录中查找信息
            for (const docId of failedDocIds) {
                // 跳过已加载的文档和测试文档'd1'
                if (loadedDocIds.has(docId) || docId === 'd1') {
                    continue;
                }

                const docInfo = recentDocs.find(doc => doc.id === docId);

                if (docInfo) {
                    // 如果在最近访问中找到了该文档信息，使用它
                    documents.value.push({
                        id: docId,
                        title: docInfo.title,
                        createTime: '未知',
                        updateTime: docInfo.accessTime || '未知'
                    });
                    loadedDocIds.add(docId);
                } else {
                    // 从关联中删除不存在的文档
                    console.warn(`文档 ${docId} 不存在，从知识库中移除`);
                    knowledgeBaseStore.removeDocumentFromKnowledgeBase(knowledgeBaseId.value, docId);
                }
            }

            // 如果有文档被移除，显示提示
            if (failedDocIds.some(docId => !loadedDocIds.has(docId))) {
                ElMessage.warning(`部分文档已不存在，已自动从知识库中移除`);
            }
        }
    } catch (error) {
        console.error('加载知识库文档失败:', error);
        ElMessage.error('加载知识库文档失败');
    }
};

// 加载所有文档列表（用于添加文档对话框）
const loadAllDocuments = async () => {
    try {
        // 尝试从API获取所有文档
        const response = await request.get('/document/list');
        if (response && response.code === 200 && Array.isArray(response.documents)) {
            // 使用Set存储已处理的文档ID和标题，用于去重
            const uniqueDocIds = new Set();
            const uniqueDocTitles = new Set();

            // 过滤掉测试文档'd1'并进行ID和标题去重
            allDocuments.value = response.documents
                .filter(doc => {
                    // 跳过'd1'文档和已经处理过的相同ID或标题的文档
                    if (doc.id === 'd1' || uniqueDocIds.has(doc.id) || uniqueDocTitles.has(doc.title)) {
                        return false;
                    }
                    uniqueDocIds.add(doc.id);
                    uniqueDocTitles.add(doc.title);
                    return true;
                })
                .map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    updateTime: new Date(doc.updateTime).toLocaleDateString(),
                    rawUpdateTime: new Date(doc.updateTime).getTime()  // 保存原始时间戳用于排序
                }))
                .sort((a, b) => b.rawUpdateTime - a.rawUpdateTime);  // 按更新时间降序排列
        } else {
            // 如果API请求失败，使用本地存储的文档列表
            // 获取最近访问的文档
            const recentDocs = knowledgeBaseStore.getRecentAccessDocs;

            // 使用最近访问的真实文档作为备选，并去除重复项和测试文档
            if (recentDocs && recentDocs.length > 0) {
                // 使用Set去重，确保每个文档ID和标题只出现一次
                const uniqueDocIds = new Set();
                const uniqueDocTitles = new Set();

                // 按访问时间排序的最近文档
                allDocuments.value = recentDocs
                    .filter(doc => {
                        // 过滤掉'd1'文档以及已经添加过的相同ID或标题的文档
                        if (doc.id === 'd1' || uniqueDocIds.has(doc.id) || uniqueDocTitles.has(doc.title)) {
                            return false;
                        }
                        uniqueDocIds.add(doc.id);
                        uniqueDocTitles.add(doc.title);
                        return true;
                    })
                    .map(doc => ({
                        id: doc.id,
                        title: doc.title,
                        updateTime: doc.accessTime || '最近访问'
                    }));
            } else {
                // 如果没有访问历史，显示空列表
                allDocuments.value = [];
                ElMessage.warning('无法获取文档列表，请先创建或访问一些文档');
            }
        }
    } catch (error) {
        console.error('加载文档列表失败:', error);
        // 使用最近访问的文档列表，并进行去重
        const recentDocs = knowledgeBaseStore.getRecentAccessDocs;
        if (recentDocs && recentDocs.length > 0) {
            // 使用Set去重，确保每个文档ID和标题只出现一次
            const uniqueDocIds = new Set();
            const uniqueDocTitles = new Set();

            allDocuments.value = recentDocs
                .filter(doc => {
                    // 过滤掉'd1'文档以及已经添加过的相同ID或标题的文档
                    if (doc.id === 'd1' || uniqueDocIds.has(doc.id) || uniqueDocTitles.has(doc.title)) {
                        return false;
                    }
                    uniqueDocIds.add(doc.id);
                    uniqueDocTitles.add(doc.title);
                    return true;
                })
                .map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    updateTime: doc.accessTime || '最近访问'
                }));
        } else {
            allDocuments.value = [];
            ElMessage.warning('无法获取文档列表，请先创建或访问一些文档');
        }
    }
};

// 监听添加文档对话框打开
watch(showAddDocDialog, async (isOpen) => {
    if (isOpen) {
        // 当对话框打开时加载所有文档
        await loadAllDocuments();
    }
});

// 添加一个openAddDocDialog方法
const openAddDocDialog = () => {
    // 清空之前的文档列表和选择状态
    allDocuments.value = [];
    selectedDocuments.value = [];
    // 打开对话框
    showAddDocDialog.value = true;
};

// 初始化
onMounted(async () => {
    if (knowledgeBaseId.value) {
        await loadKnowledgeBaseDetails(knowledgeBaseId.value);
    }
});
</script>

<style scoped>
.knowledge-base-container {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h1 {
    margin: 0;
    font-size: 24px;
    color: #333;
}

.knowledge-base-content {
    margin-top: 20px;
}

.kb-card {
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.3s ease;
    display: flex;
}

.kb-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kb-icon {
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--el-color-primary-light-9);
    border-radius: 8px;
    margin-right: 15px;
}

.kb-icon i {
    font-size: 30px;
    color: var(--el-color-primary);
}

.kb-info {
    flex: 1;
}

.kb-info h3 {
    margin: 0 0 5px 0;
    font-size: 18px;
    color: #333;
}

.kb-info p {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.kb-meta {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 12px;
}

.doc-title {
    color: var(--el-color-primary);
    cursor: pointer;
}

.doc-title:hover {
    text-decoration: underline;
}

.doc-actions {
    margin-bottom: 15px;
}

.empty-docs {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 40px;
}

.empty-docs .el-button {
    margin-top: 15px;
}

.empty-docs-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 40px;
}
</style>