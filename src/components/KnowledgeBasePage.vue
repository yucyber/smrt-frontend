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
                            <i :class="kb.icon || 'ri-book-2-line'"></i>
                        </div>
                        <div class="kb-info">
                            <h3>{{ kb.name }}</h3>
                            <p>{{ kb.description || '无描述' }}</p>
                            <div class="kb-meta">
                                <span>{{ getDocumentCount(kb.id) }}个文档</span>
                                <span>{{ formatDate(kb.updated_at) }}</span>
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
                                    @click="removeDocumentFromKnowledgeBase(scope.row.id)">移除</el-button>
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
const knowledgeBaseId = computed(() => {
    const id = route.params.id;
    console.log('当前路由参数ID:', id, typeof id);
    return id;
});

// Store
const knowledgeBaseStore = useKnowledgeBaseStore();

// 对话框控制
const showAddDocDialog = ref(false);
const showDeleteConfirmDialog = ref(false);
const showCreateDialog = ref(false);

// 获取文档数量 - 带缓存的实现，确保视图刷新时数据一致性
const documentCountCache = ref({});

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
const loading = ref(false);

// 过滤后的文档列表（用于对话框）
const filteredDocumentsForDialog = computed(() => {
    if (!knowledgeBaseId.value) return [];

    console.log('所有文档:', allDocuments.value);

    // 过滤出未添加到任何知识库的文档
    return allDocuments.value.filter(doc => {
        // 使用store中的方法检查文档是否已在任何知识库中
        return !knowledgeBaseStore.isDocumentInAnyKnowledgeBase(doc.id);
    });
});

// 初始化
onMounted(async () => {
    loading.value = true;
    try {
        console.log('开始初始化KnowledgeBasePage');

        // 加载知识库数据
        await knowledgeBaseStore.loadAllData();
        console.log('已加载知识库数据');

        // 确保所有知识库的文档关联都已加载
        const kbIds = knowledgeBaseStore.getKnowledgeBases.map(kb => kb.id);
        for (const kbId of kbIds) {
            await knowledgeBaseStore.refreshDocumentAssociations(kbId);
        }
        console.log('已刷新所有知识库的文档关联');

        // 加载所有文档
        await loadAllDocuments();
        console.log('已加载所有文档');

        // 如果有特定的知识库ID，加载该知识库的详情
        if (knowledgeBaseId.value) {
            console.log('加载知识库详情:', knowledgeBaseId.value);
            await loadKnowledgeBaseDetails(knowledgeBaseId.value);
        }

        console.log('初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        ElMessage.error('加载数据失败，请稍后重试');
    } finally {
        loading.value = false;
    }
});

// 监听路由参数变化
watch(() => route.params.id, async (newId, oldId) => {
    console.log('路由参数变化:', oldId, '->', newId);

    // 安全地清除文档计数缓存
    if (documentCountCache && documentCountCache.value) {
        documentCountCache.value = {};
    }

    if (newId) {
        console.log('开始加载知识库详情:', newId);
        await loadKnowledgeBaseDetails(newId);
    } else {
        console.log('无ID参数，显示知识库列表');
    }
}, { immediate: true });

// 监听知识库数据变化，更新缓存
watch(() => knowledgeBases.value, () => {
    console.log('知识库数据变化，清除文档计数缓存');
    // 安全地清除文档计数缓存
    if (documentCountCache && documentCountCache.value) {
        documentCountCache.value = {};
    }
}, { deep: true });

// 打开知识库
const openKnowledgeBase = (id) => {
    console.log('点击打开知识库:', id);
    try {
        // 确保知识库存在
        const kb = knowledgeBaseStore.getKnowledgeBaseById(id);
        if (kb) {
            console.log('找到知识库:', kb);
            // 使用命名路由导航
            router.push({
                name: 'knowledgeBaseDetail',
                params: { id: id }
            });
        } else {
            console.error('未找到知识库:', id);
            ElMessage.error('未找到该知识库');
        }
    } catch (error) {
        console.error('打开知识库时出错:', error);
        ElMessage.error('打开知识库时出错');
    }
};

// 编辑文档
const editDocument = (id) => {
    // 记录访问
    const doc = documents.value.find(doc => doc.id === id);
    if (doc) {
        console.log('记录文档访问:', id, doc.title);
        try {
            // 直接通过API记录文档访问，不依赖store方法
            request({
                url: '/knowledge_base/user/document-access',
                method: 'post',
                data: {
                    document_id: id,
                    title: doc.title
                }
            }).then(() => {
                console.log('文档访问记录成功');
                // 刷新最近访问数据
                knowledgeBaseStore.loadRecentAccessDocs();
            }).catch(error => {
                console.error('文档访问记录失败:', error);
            });
        } catch (error) {
            console.error('记录文档访问异常:', error);
        }
    }
    router.push({ name: 'edit', params: { id } });
};

// 处理选择文档
const handleSelectionChange = (val) => {
    selectedDocuments.value = val;
};

// 加载所有文档
const loadAllDocuments = async () => {
    try {
        console.log('开始加载所有文档');
        const response = await request({
            url: '/document/list',
            method: 'get'
        });

        console.log('文档列表响应:', response);

        if (response && response.code === '200') {  // 注意这里是字符串'200'而不是数字200
            // 后端返回的数据格式是 {'documents': [...], 'code': '200'}
            if (Array.isArray(response.documents)) {
                allDocuments.value = response.documents;
                console.log('成功加载文档列表:', allDocuments.value.length, '个文档');
            }
            else {
                console.error('未知的文档列表格式:', response);
                allDocuments.value = [];
            }

            // 确保每个文档对象都有必要的属性
            allDocuments.value = allDocuments.value.map(doc => {
                // 提取标题，如果没有标题则使用内容的前20个字符
                const title = doc.title || (doc.content ? doc.content.replace(/<[^>]*>/g, '').substring(0, 20) + '...' : '未命名文档');
                return {
                    ...doc,
                    title: title,
                    updateTime: doc.updated_at || doc.updateTime || new Date().toLocaleString()
                };
            });

            console.log('处理后的文档列表:', allDocuments.value);
        } else {
            console.error('获取文档列表失败:', response);
            // 使用空数组作为默认值
            allDocuments.value = [];
        }
    } catch (error) {
        console.error('获取文档异常:', error);
        // 使用空数组作为默认值
        allDocuments.value = [];
    }
};

// 打开添加文档对话框
const openAddDocDialog = () => {
    showAddDocDialog.value = true;
};

// 添加文档到知识库
const addDocumentsToKnowledgeBase = async () => {
    if (!selectedDocuments.value || selectedDocuments.value.length === 0) {
        ElMessage.warning('请选择要添加的文档');
        return;
    }

    console.log('选中的文档:', selectedDocuments.value);

    loading.value = true;
    try {
        // 提取文档ID
        const docIds = selectedDocuments.value.map(doc => doc.id);
        console.log('要添加的文档IDs:', docIds);

        let allSuccess = true;
        for (const docId of docIds) {
            const success = await knowledgeBaseStore.addDocumentToKnowledgeBase(knowledgeBaseId.value, docId);
            if (!success) {
                console.error(`添加文档 ${docId} 失败`);
                allSuccess = false;
            }
        }

        // 重新加载文档
        await loadDocumentsForKnowledgeBase();

        // 刷新知识库文档关联
        await knowledgeBaseStore.refreshDocumentAssociations(knowledgeBaseId.value);

        // 重新加载所有文档关联以确保UI一致性
        await knowledgeBaseStore.loadAllData();

        // 安全地清除文档计数缓存
        if (documentCountCache && documentCountCache.value) {
            documentCountCache.value = {};
        }

        showAddDocDialog.value = false;

        if (allSuccess) {
            ElMessage.success('文档已添加到知识库');
        } else {
            ElMessage.warning('部分文档添加失败，请查看控制台日志');
        }
    } catch (error) {
        console.error('添加文档失败:', error);
        ElMessage.error('添加文档失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 从知识库移除文档
const removeDocumentFromKnowledgeBase = async (docId) => {
    try {
        loading.value = true;
        console.log(`尝试从知识库 ${knowledgeBaseId.value} 中移除文档 ${docId}`);

        // 调用store中的方法移除文档
        const success = await knowledgeBaseStore.removeDocumentFromKnowledgeBase(knowledgeBaseId.value, docId);

        if (success) {
            // 重新加载文档
            await loadDocumentsForKnowledgeBase();

            // 刷新知识库文档关联
            await knowledgeBaseStore.refreshDocumentAssociations(knowledgeBaseId.value);

            // 安全地清除文档计数缓存
            if (documentCountCache && documentCountCache.value) {
                documentCountCache.value = {};
            }

            ElMessage.success('已从知识库移除文档');
        } else {
            ElMessage.error('移除文档失败');
        }
    } catch (error) {
        console.error('移除文档失败:', error);
        ElMessage.error('移除文档失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 保存知识库设置
const saveKnowledgeBase = async () => {
    if (!knowledgeBaseForm.value.name) {
        ElMessage.warning('知识库名称不能为空');
        return;
    }

    loading.value = true;
    try {
        const success = await knowledgeBaseStore.updateKnowledgeBase(
            knowledgeBaseId.value,
            knowledgeBaseForm.value
        );

        if (success) {
            // 更新当前知识库显示
            currentKnowledgeBase.value = knowledgeBaseStore.getKnowledgeBaseById(knowledgeBaseId.value);
            ElMessage.success('知识库设置已更新');
        } else {
            ElMessage.error('更新知识库失败');
        }
    } catch (error) {
        console.error('保存知识库设置失败:', error);
        ElMessage.error('保存知识库设置失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 确认删除知识库
const confirmDeleteKnowledgeBase = () => {
    ElMessageBox.confirm(
        '确定要删除该知识库吗？此操作无法撤销。',
        '删除确认',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        await deleteKnowledgeBase();
    }).catch(() => {
        // 用户取消删除
    });
};

// 删除知识库
const deleteKnowledgeBase = async () => {
    loading.value = true;
    try {
        const success = await knowledgeBaseStore.deleteKnowledgeBase(knowledgeBaseId.value);

        if (success) {
            ElMessage.success('知识库已删除');
            router.push('/dashboard/KnowledgeBasePage');
        } else {
            ElMessage.error('删除知识库失败');
        }
    } catch (error) {
        console.error('删除知识库失败:', error);
        ElMessage.error('删除知识库失败，请稍后重试');
    } finally {
        loading.value = false;
    }
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
const submitCreateKnowledgeBase = async () => {
    if (!createForm.value.name) {
        ElMessage.warning('知识库名称不能为空');
        return;
    }

    loading.value = true;
    try {
        console.log('提交创建知识库:', createForm.value);
        const result = await knowledgeBaseStore.createKnowledgeBase(createForm.value);

        if (result) {
            showCreateDialog.value = false;
            ElMessage.success('知识库创建成功');

            // 如果返回的是ID，则导航到该知识库
            if (typeof result === 'number' || typeof result === 'string') {
                router.push(`/dashboard/KnowledgeBasePage/${result}`);
            } else {
                // 否则刷新页面
                router.push('/dashboard/KnowledgeBasePage');
            }
        } else {
            ElMessage.error('创建知识库失败');
        }
    } catch (error) {
        console.error('创建知识库失败:', error);
        ElMessage.error('创建知识库失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 加载知识库详情
const loadKnowledgeBaseDetails = async (id) => {
    console.log('执行loadKnowledgeBaseDetails:', id);
    loading.value = true;
    try {
        // 确保知识库数据已加载
        if (knowledgeBases.value.length === 0) {
            console.log('知识库列表为空，重新加载数据');
            await knowledgeBaseStore.loadAllData();
        }

        const kb = knowledgeBaseStore.getKnowledgeBaseById(id);
        console.log('获取到知识库:', kb);

        if (kb) {
            currentKnowledgeBase.value = kb;
            knowledgeBaseForm.value = {
                name: kb.name,
                description: kb.description || '',
                icon: kb.icon || 'ri-book-2-line'
            };

            // 加载该知识库中的文档
            await loadDocumentsForKnowledgeBase();
        } else {
            console.error('知识库不存在:', id);
            ElMessage.error('知识库不存在或已被删除');
            router.push({
                name: 'knowledgeBaseList'
            });
        }
    } catch (error) {
        console.error('加载知识库详情失败:', error);
        ElMessage.error('加载知识库详情失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 加载知识库中的文档
const loadDocumentsForKnowledgeBase = async () => {
    loading.value = true;
    try {
        console.log('开始加载知识库文档, 知识库ID:', knowledgeBaseId.value);

        // 直接从API获取文档列表
        const response = await request({
            url: `/knowledge_base/knowledge-bases/${knowledgeBaseId.value}/documents`,
            method: 'get'
        });

        console.log('知识库文档API响应:', response);

        // 处理响应
        let docList = [];
        if (Array.isArray(response)) {
            docList = response;
            console.log('接收到直接数组格式的文档列表');
        } else if (response && response.code === '200' && Array.isArray(response.documents)) {
            docList = response.documents;
            console.log('接收到code:200和documents数组格式');
        } else if (response && Array.isArray(response.data)) {
            docList = response.data;
            console.log('接收到data数组格式');
        }

        console.log('解析后的文档列表:', docList);

        if (docList.length === 0) {
            console.log('知识库中没有文档');
            documents.value = [];
            return;
        }

        // 处理文档数据
        documents.value = docList.map(doc => ({
            id: doc.id,
            title: doc.title || '未命名文档',
            updateTime: doc.updated_at || new Date().toLocaleString(),
            createTime: doc.created_at || new Date().toLocaleString(),
            category: doc.category || '未分类',
            wordCount: doc.word_count || 0
        }));

        console.log('处理后的文档列表:', documents.value);

        // 刷新知识库中的文档关联
        await knowledgeBaseStore.refreshDocumentAssociations(knowledgeBaseId.value);
    } catch (error) {
        console.error('加载知识库文档失败:', error);
        ElMessage.error('加载知识库文档失败，请稍后重试');
        // 使用空数组作为默认值
        documents.value = [];
    } finally {
        loading.value = false;
    }
};

// 获取文档数量
const getDocumentCount = (knowledgeBaseId) => {
    try {
        // 转为字符串ID便于比较
        const kbIdStr = String(knowledgeBaseId);

        // 确保documentCountCache.value已初始化
        if (!documentCountCache || !documentCountCache.value) {
            documentCountCache.value = {};
        }

        // 如果缓存中没有，则获取最新数据
        if (documentCountCache.value[kbIdStr] === undefined) {
            console.log(`获取知识库 ${kbIdStr} 的文档数量`);
            const count = knowledgeBaseStore.getDocumentsInKnowledgeBase(kbIdStr).length || 0;
            documentCountCache.value[kbIdStr] = count;
        }

        return documentCountCache.value[kbIdStr];
    } catch (error) {
        console.error('获取文档数量出错:', error);
        return 0; // 发生错误时返回0
    }
};

// 格式化日期
const formatDate = (date) => {
    if (!date) return '无';
    const formattedDate = new Date(date).toLocaleString();
    return formattedDate;
};
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