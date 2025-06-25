import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
    // 知识库数据
    const knowledgeBases = ref([]);

    // 文档到知识库的关联映射
    const documentAssociations = ref({});

    // 最近访问文档
    const recentAccessDocs = ref([]);

    // 加载所有数据
    const loadAllData = () => {
        // 加载知识库
        const storedKnowledgeBases = localStorage.getItem('smartEditor_knowledgeBases');
        if (storedKnowledgeBases) {
            knowledgeBases.value = JSON.parse(storedKnowledgeBases);
        } else {
            // 初始化默认知识库
            knowledgeBases.value = [
                {
                    id: 'kb1',
                    name: '项目文档',
                    description: '包含所有项目相关的文档和资料',
                    icon: 'ri-folder-2-line',
                    docCount: 0,
                    lastUpdated: new Date().toLocaleDateString()
                },
                {
                    id: 'kb2',
                    name: '学习笔记',
                    description: '各种学习和培训的笔记',
                    icon: 'ri-book-2-line',
                    docCount: 0,
                    lastUpdated: new Date().toLocaleDateString()
                },
                {
                    id: 'kb3',
                    name: '工作资料',
                    description: '日常工作相关的资料和文档',
                    icon: 'ri-briefcase-line',
                    docCount: 0,
                    lastUpdated: new Date().toLocaleDateString()
                }
            ];
            saveKnowledgeBases();
        }

        // 加载文档关联
        const storedDocumentAssociations = localStorage.getItem('smartEditor_documentAssociations');
        if (storedDocumentAssociations) {
            documentAssociations.value = JSON.parse(storedDocumentAssociations);

            // 清理'd1'测试文档的关联
            if (documentAssociations.value['d1']) {
                delete documentAssociations.value['d1'];
                console.log('已清理测试文档d1的关联');
                saveDocumentAssociations();
            }

            // 清理不存在文档的关联
            let hasChanges = false;
            for (const docId in documentAssociations.value) {
                if (docId === 'd1' || (docId.startsWith && docId.startsWith('d1-'))) {
                    delete documentAssociations.value[docId];
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                console.log('已清理无效的测试文档关联');
                saveDocumentAssociations();
            }
        }

        // 加载最近访问文档
        const storedRecentDocs = localStorage.getItem('smartEditor_recentAccessDocs');
        if (storedRecentDocs) {
            recentAccessDocs.value = JSON.parse(storedRecentDocs);

            // 清理'd1'测试文档的访问记录
            if (recentAccessDocs.value.some(doc => doc.id === 'd1')) {
                recentAccessDocs.value = recentAccessDocs.value.filter(doc => doc.id !== 'd1');
                console.log('已从最近访问记录中移除测试文档d1');
                saveRecentAccessDocs();
            }
        }
    };

    // 保存知识库数据到localStorage
    const saveKnowledgeBases = () => {
        localStorage.setItem('smartEditor_knowledgeBases', JSON.stringify(knowledgeBases.value));
    };

    // 保存文档关联数据
    const saveDocumentAssociations = () => {
        localStorage.setItem('smartEditor_documentAssociations', JSON.stringify(documentAssociations.value));
    };

    // 保存最近访问文档
    const saveRecentAccessDocs = () => {
        localStorage.setItem('smartEditor_recentAccessDocs', JSON.stringify(recentAccessDocs.value));
    };

    // 获取知识库列表
    const getKnowledgeBases = computed(() => {
        return knowledgeBases.value.map(kb => {
            // 计算每个知识库的文档数量
            const kbDocs = Object.entries(documentAssociations.value)
                .filter(([_, kbIds]) => kbIds.includes(kb.id))
                .map(([docId]) => docId);

            return {
                ...kb,
                docCount: kbDocs.length
            };
        });
    });

    // 获取知识库详情
    const getKnowledgeBaseById = (id) => {
        return knowledgeBases.value.find(kb => kb.id === id);
    };

    // 创建知识库
    const createKnowledgeBase = (data) => {
        const newId = `kb${Date.now()}`;
        const newKb = {
            id: newId,
            name: data.name,
            description: data.description || '无描述',
            icon: data.icon || 'ri-book-2-line',
            docCount: 0,
            lastUpdated: new Date().toLocaleDateString()
        };

        knowledgeBases.value.push(newKb);
        saveKnowledgeBases();
        return newId;
    };

    // 更新知识库
    const updateKnowledgeBase = (id, data) => {
        const index = knowledgeBases.value.findIndex(kb => kb.id === id);
        if (index !== -1) {
            knowledgeBases.value[index] = {
                ...knowledgeBases.value[index],
                name: data.name,
                description: data.description,
                icon: data.icon,
                lastUpdated: new Date().toLocaleDateString()
            };
            saveKnowledgeBases();
            return true;
        }
        return false;
    };

    // 删除知识库
    const deleteKnowledgeBase = (id) => {
        knowledgeBases.value = knowledgeBases.value.filter(kb => kb.id !== id);

        // 清理关联
        Object.keys(documentAssociations.value).forEach(docId => {
            if (documentAssociations.value[docId].includes(id)) {
                documentAssociations.value[docId] = documentAssociations.value[docId].filter(kbId => kbId !== id);
            }
        });

        saveKnowledgeBases();
        saveDocumentAssociations();
        return true;
    };

    // 获取知识库中的文档
    const getDocumentsInKnowledgeBase = (kbId) => {
        // 检查知识库是否存在
        if (!knowledgeBases.value.some(kb => kb.id === kbId)) {
            console.warn(`知识库 ${kbId} 不存在`);
            return [];
        }

        const docIds = Object.entries(documentAssociations.value)
            .filter(([_, kbIds]) => kbIds.includes(kbId))
            .map(([docId]) => docId);

        return docIds;
    };

    // 将文档添加到知识库
    const addDocumentsToKnowledgeBase = (kbId, docIds) => {
        // 检查知识库是否存在
        if (!knowledgeBases.value.some(kb => kb.id === kbId)) {
            console.warn(`知识库 ${kbId} 不存在, 无法添加文档`);
            return false;
        }

        // 过滤掉空的docId
        const validDocIds = docIds.filter(id => id && id.trim() !== '');

        if (validDocIds.length === 0) {
            return false;
        }

        validDocIds.forEach(docId => {
            if (!documentAssociations.value[docId]) {
                documentAssociations.value[docId] = [];
            }

            if (!documentAssociations.value[docId].includes(kbId)) {
                documentAssociations.value[docId].push(kbId);
            }
        });

        // 更新知识库最后修改时间
        const kbIndex = knowledgeBases.value.findIndex(kb => kb.id === kbId);
        if (kbIndex !== -1) {
            knowledgeBases.value[kbIndex].lastUpdated = new Date().toLocaleDateString();
            saveKnowledgeBases();
        }

        saveDocumentAssociations();
        return true;
    };

    // 从知识库中移除文档
    const removeDocumentFromKnowledgeBase = (kbId, docId) => {
        if (documentAssociations.value[docId]) {
            documentAssociations.value[docId] = documentAssociations.value[docId].filter(id => id !== kbId);
            saveDocumentAssociations();
        }
    };

    // 记录文档访问
    const recordDocumentAccess = (docId, docTitle) => {
        // 移除现有记录（如果存在）
        recentAccessDocs.value = recentAccessDocs.value.filter(doc => doc.id !== docId);

        // 添加到最前面
        recentAccessDocs.value.unshift({
            id: docId,
            title: docTitle,
            accessTime: new Date().toISOString()
        });

        // 限制保留最新的10条
        if (recentAccessDocs.value.length > 10) {
            recentAccessDocs.value = recentAccessDocs.value.slice(0, 10);
        }

        saveRecentAccessDocs();
    };

    // 获取最近访问文档
    const getRecentAccessDocs = computed(() => {
        return recentAccessDocs.value.map(doc => {
            const now = new Date();
            const accessTime = new Date(doc.accessTime);
            const diffTime = now - accessTime;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let formattedTime;
            if (diffDays === 0) {
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                if (diffHours === 0) {
                    const diffMinutes = Math.floor(diffTime / (1000 * 60));
                    formattedTime = `${diffMinutes}分钟前`;
                } else {
                    formattedTime = `${diffHours}小时前`;
                }
            } else if (diffDays === 1) {
                formattedTime = '昨天';
            } else if (diffDays < 7) {
                formattedTime = `${diffDays}天前`;
            } else if (diffDays < 30) {
                formattedTime = '上周';
            } else {
                formattedTime = accessTime.toLocaleDateString();
            }

            return {
                ...doc,
                accessTime: formattedTime
            };
        });
    });

    // 初始化
    loadAllData();

    return {
        knowledgeBases,
        getKnowledgeBases,
        getKnowledgeBaseById,
        createKnowledgeBase,
        updateKnowledgeBase,
        deleteKnowledgeBase,
        getDocumentsInKnowledgeBase,
        addDocumentsToKnowledgeBase,
        removeDocumentFromKnowledgeBase,
        recordDocumentAccess,
        getRecentAccessDocs,
        documentAssociations
    };
}); 