import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '../utils/request';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
    // 知识库数据
    const knowledgeBases = ref([]);

    // 文档到知识库的关联映射
    const documentAssociations = ref({});

    // 最近访问文档
    const recentAccessDocs = ref([]);

    // 上次加载最近访问文档的时间戳，用于防抖
    let lastLoadTime = null;

    // 加载所有数据
    const loadAllData = async () => {
        try {
            await loadKnowledgeBases();
            await loadRecentAccessDocs();
            // 文档关联会在加载知识库时一并处理
        } catch (error) {
            console.error("加载知识库数据失败:", error);
        }
    };

    // 加载知识库列表
    const loadKnowledgeBases = async () => {
        try {
            console.log('开始加载知识库列表');
            const response = await request({
                url: '/knowledge_base/knowledge-bases',
                method: 'get'
            });

            console.log('知识库列表响应:', response);

            // 处理不同的返回格式
            if (response) {
                if (Array.isArray(response)) {
                    // 直接使用response作为知识库列表
                    knowledgeBases.value = response;
                } else if (response.code === 200 || response.code === 201) {
                    if (Array.isArray(response.data)) {
                        // 使用response.data作为知识库列表
                        knowledgeBases.value = response.data;
                    } else if (Array.isArray(response)) {
                        // 直接使用response作为知识库列表
                        knowledgeBases.value = response;
                    } else {
                        console.error("加载知识库返回格式错误:", response);
                        knowledgeBases.value = [];
                    }
                } else {
                    console.error("加载知识库返回错误:", response);
                    knowledgeBases.value = [];
                }

                console.log('成功加载知识库列表:', knowledgeBases.value.length, '个知识库');

                // 加载所有知识库的文档关联
                await loadAllDocumentAssociations();
            } else {
                console.error("加载知识库返回为空");
                knowledgeBases.value = [];
            }
        } catch (error) {
            console.error("加载知识库异常:", error);
            // 添加错误处理，使用空数组作为默认值
            knowledgeBases.value = [];
        }
    };

    // 加载所有文档关联
    const loadAllDocumentAssociations = async () => {
        // 清空现有关联
        documentAssociations.value = {};

        // 为每个知识库加载文档
        for (const kb of knowledgeBases.value) {
            try {
                console.log(`开始加载知识库 ${kb.id} 的文档关联`);
                const response = await request({
                    url: `/knowledge_base/knowledge-bases/${kb.id}/documents`,
                    method: 'get'
                });

                console.log(`知识库 ${kb.id} 文档关联响应:`, response);

                // 处理不同的响应格式
                let docList = [];

                if (response && response.code === 200 && Array.isArray(response.data)) {
                    docList = response.data;
                } else if (Array.isArray(response)) {
                    docList = response;
                } else if (response && Array.isArray(response.documents)) {
                    docList = response.documents;
                }

                if (docList.length > 0) {
                    console.log(`知识库 ${kb.id} 包含 ${docList.length} 个文档`);

                    // 更新文档关联
                    docList.forEach(doc => {
                        const docId = String(doc.id);
                        if (!documentAssociations.value[docId]) {
                            documentAssociations.value[docId] = [];
                        }
                        if (!documentAssociations.value[docId].includes(kb.id)) {
                            documentAssociations.value[docId].push(kb.id);
                        }
                    });
                } else {
                    console.log(`知识库 ${kb.id} 没有关联文档`);
                }
            } catch (error) {
                console.error(`加载知识库 ${kb.id} 的文档失败:`, error);
            }
        }

        console.log('文档关联加载完成:', documentAssociations.value);
    };

    // 加载最近访问文档
    const loadRecentAccessDocs = async (forceRefresh = false) => {
        try {
            // 防抖：如果短时间内多次调用且不是强制刷新，则跳过请求
            if (!forceRefresh && recentAccessDocs.value.length > 0) {
                // 检查上次加载时间是否在2秒内
                const now = Date.now();
                if (lastLoadTime && (now - lastLoadTime < 2000)) {
                    console.log('最近访问文档加载过于频繁，使用缓存数据');
                    return recentAccessDocs.value;
                }
            }

            // 记录本次加载时间
            lastLoadTime = Date.now();

            console.log('开始加载最近访问文档，强制刷新:', forceRefresh);
            const response = await request({
                url: '/knowledge_base/user/recent-documents',
                method: 'get',
                params: {
                    _t: Date.now() // 添加时间戳防止缓存
                }
            });

            console.log('最近访问文档响应:', response);

            if (response && Array.isArray(response)) {
                // 后端直接返回数组格式
                recentAccessDocs.value = response.map(doc => ({
                    id: doc.document_id,
                    title: doc.document_title,
                    accessTime: new Date(doc.last_accessed_at).toLocaleString()
                }));
                console.log('成功加载最近访问文档:', recentAccessDocs.value.length, '个文档');
            } else {
                console.error('未知的最近访问文档格式:', response);
                recentAccessDocs.value = [];
            }
            return recentAccessDocs.value;
        } catch (error) {
            console.error("加载最近访问文档失败:", error);
            // 添加错误处理，使用空数组作为默认值
            recentAccessDocs.value = [];
            return [];
        }
    };

    // 记录文档访问
    const recordDocumentAccess = async (docId, title) => {
        try {
            // 记录到后端
            console.log(`记录文档访问: ID=${docId}, 标题=${title}`);
            await request({
                url: '/knowledge_base/user/document-access',
                method: 'post',
                data: {
                    document_id: docId,
                    title: title
                }
            });

            // 更新本地缓存的最近文档
            console.log('文档访问记录成功，强制刷新最近访问数据');
            await loadRecentAccessDocs(true);
        } catch (error) {
            console.error("记录文档访问失败:", error);
        }
    };

    // 获取知识库列表
    const getKnowledgeBases = computed(() => {
        return knowledgeBases.value;
    });

    // 获取最近访问的文档
    const getRecentAccessDocs = computed(() => {
        return recentAccessDocs.value || [];
    });

    // 获取知识库详情
    const getKnowledgeBaseById = (id) => {
        console.log('查找知识库:', id, '类型:', typeof id);
        console.log('当前知识库列表:', knowledgeBases.value);

        // 确保ID类型一致（转为字符串比较）
        const idStr = String(id);
        const kb = knowledgeBases.value.find(kb => String(kb.id) === idStr);

        console.log('查找结果:', kb);
        return kb;
    };

    // 创建知识库
    const createKnowledgeBase = async (data) => {
        try {
            console.log('创建知识库请求数据:', data);
            const response = await request({
                url: '/knowledge_base/knowledge-bases',
                method: 'post',
                data: {
                    name: data.name,
                    description: data.description || '无描述',
                    icon: data.icon || 'ri-book-2-line'
                }
            });

            console.log('创建知识库响应:', response);

            // 处理不同的响应格式
            if (response && (response.code === 200 || response.code === 201)) {
                // 直接从response中获取id
                let newId = null;

                if (response.id) {
                    newId = response.id;
                } else if (response.data && response.data.id) {
                    newId = response.data.id;
                }

                if (newId) {
                    // 重新加载知识库列表
                    await loadKnowledgeBases();
                    return newId;
                } else {
                    console.error('创建知识库成功但未返回ID:', response);
                    // 即使没有ID也重新加载知识库列表
                    await loadKnowledgeBases();
                    return true; // 返回true表示创建成功
                }
            }

            console.error('创建知识库失败:', response);
            return null;
        } catch (error) {
            console.error("创建知识库异常:", error);
            return null;
        }
    };

    // 更新知识库
    const updateKnowledgeBase = async (id, data) => {
        try {
            const response = await request({
                url: `/knowledge_base/knowledge-bases/${id}`,
                method: 'put',
                data: {
                    name: data.name,
                    description: data.description,
                    icon: data.icon
                }
            });

            if (response && (response.code === 200 || response.code === 201)) {
                // 更新本地知识库数据
                await loadKnowledgeBases();
                return true;
            }
            return false;
        } catch (error) {
            console.error("更新知识库失败:", error);
            return false;
        }
    };

    // 删除知识库
    const deleteKnowledgeBase = async (id) => {
        try {
            const response = await request({
                url: `/knowledge_base/knowledge-bases/${id}`,
                method: 'delete'
            });

            if (response && (response.code === 200 || response.code === 201)) {
                // 更新本地数据
                await loadKnowledgeBases();
                return true;
            }
            return false;
        } catch (error) {
            console.error("删除知识库失败:", error);
            return false;
        }
    };

    // 获取知识库中的文档
    const getDocumentsInKnowledgeBase = (kbId) => {
        try {
            // 确保kbId是字符串类型进行比较
            const kbIdStr = String(kbId);
            console.log('获取知识库文档，知识库ID:', kbIdStr);
            console.log('当前文档关联:', documentAssociations.value);

            const docIds = Object.entries(documentAssociations.value)
                .filter(([_, kbIds]) => {
                    // 确保使用字符串比较
                    return kbIds.some(id => String(id) === kbIdStr);
                })
                .map(([docId]) => docId);

            console.log('知识库中的文档IDs:', docIds);
            return docIds;
        } catch (error) {
            console.error(`获取知识库 ${kbId} 的文档失败:`, error);
            return [];
        }
    };

    // 向知识库添加文档
    const addDocumentToKnowledgeBase = async (kbId, docId) => {
        try {
            console.log(`添加文档 ${docId} 到知识库 ${kbId}`);
            const response = await request({
                url: `/knowledge_base/knowledge-bases/${kbId}/documents`,
                method: 'post',
                data: {
                    document_id: docId
                }
            });

            if (response && (response.code === '200' || response.code === 200 || response.code === 201)) {
                console.log('添加文档成功:', response);

                // 更新本地关联
                const docIdStr = String(docId);
                const kbIdStr = String(kbId);

                if (!documentAssociations.value[docIdStr]) {
                    documentAssociations.value[docIdStr] = [];
                }
                if (!documentAssociations.value[docIdStr].includes(kbIdStr)) {
                    documentAssociations.value[docIdStr].push(kbIdStr);
                }

                console.log(`更新后的文档关联:`, documentAssociations.value);
                return true;
            }
            return false;
        } catch (error) {
            console.error("添加文档到知识库失败:", error);
            return false;
        }
    };

    // 从知识库中删除文档
    const removeDocumentFromKnowledgeBase = async (kbId, docId) => {
        try {
            console.log(`移除知识库 ${kbId} 中的文档 ${docId}`);
            const response = await request({
                url: `/knowledge_base/knowledge-bases/${kbId}/documents/${docId}`,
                method: 'delete'
            });

            if (response && (response.code === '200' || response.code === 200 || response.code === 201)) {
                console.log('移除文档成功:', response);

                // 更新本地关联
                const docIdStr = String(docId);
                const kbIdStr = String(kbId);

                if (documentAssociations.value[docIdStr]) {
                    documentAssociations.value[docIdStr] = documentAssociations.value[docIdStr].filter(id => String(id) !== kbIdStr);
                    console.log(`更新后的文档关联:`, documentAssociations.value);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("从知识库移除文档失败:", error);
            return false;
        }
    };

    // 刷新特定知识库的文档关联
    const refreshDocumentAssociations = async (kbId) => {
        try {
            console.log(`刷新知识库 ${kbId} 的文档关联`);
            const response = await request({
                url: `/knowledge_base/knowledge-bases/${kbId}/documents`,
                method: 'get'
            });

            console.log(`知识库 ${kbId} 文档关联刷新响应:`, response);

            // 处理不同的响应格式
            let docList = [];

            if (Array.isArray(response)) {
                docList = response;
            } else if (response && (response.code === '200' || response.code === 200) && Array.isArray(response.documents)) {
                docList = response.documents;
            } else if (response && Array.isArray(response.data)) {
                docList = response.data;
            }

            // 更新该知识库的关联
            if (docList.length > 0) {
                console.log(`知识库 ${kbId} 包含 ${docList.length} 个文档`);

                // 先清除该知识库的所有关联
                Object.keys(documentAssociations.value).forEach(docId => {
                    if (documentAssociations.value[docId].includes(kbId)) {
                        documentAssociations.value[docId] = documentAssociations.value[docId].filter(id => id !== kbId);
                    }
                });

                // 重新添加关联
                docList.forEach(doc => {
                    const docId = String(doc.id);
                    if (!documentAssociations.value[docId]) {
                        documentAssociations.value[docId] = [];
                    }
                    if (!documentAssociations.value[docId].includes(kbId)) {
                        documentAssociations.value[docId].push(kbId);
                    }
                });

                console.log(`知识库 ${kbId} 的文档关联已更新:`, documentAssociations.value);
            } else {
                console.log(`知识库 ${kbId} 没有关联文档`);
                // 清除该知识库的所有关联
                Object.keys(documentAssociations.value).forEach(docId => {
                    if (documentAssociations.value[docId].includes(kbId)) {
                        documentAssociations.value[docId] = documentAssociations.value[docId].filter(id => id !== kbId);
                    }
                });
            }

            return true;
        } catch (error) {
            console.error(`刷新知识库 ${kbId} 的文档关联失败:`, error);
            return false;
        }
    };

    // 检查文档是否已经在任何知识库中
    const isDocumentInAnyKnowledgeBase = (docId) => {
        const docIdStr = String(docId);
        // 检查文档关联
        return documentAssociations.value[docIdStr] && documentAssociations.value[docIdStr].length > 0;
    };

    // 获取文档所属的知识库列表
    const getKnowledgeBasesContainingDocument = (docId) => {
        const docIdStr = String(docId);
        const kbIds = documentAssociations.value[docIdStr] || [];

        // 返回详细的知识库信息
        return kbIds.map(kbId => {
            const kb = getKnowledgeBaseById(kbId);
            return kb ? {
                id: kb.id,
                name: kb.name
            } : { id: kbId, name: '未知知识库' };
        });
    };

    return {
        knowledgeBases,
        documentAssociations,
        recentAccessDocs,
        loadAllData,
        loadRecentAccessDocs,
        getKnowledgeBases,
        getRecentAccessDocs,
        getKnowledgeBaseById,
        createKnowledgeBase,
        updateKnowledgeBase,
        deleteKnowledgeBase,
        getDocumentsInKnowledgeBase,
        addDocumentToKnowledgeBase,
        removeDocumentFromKnowledgeBase,
        recordDocumentAccess,
        refreshDocumentAssociations,
        isDocumentInAnyKnowledgeBase,
        getKnowledgeBasesContainingDocument
    };
}); 