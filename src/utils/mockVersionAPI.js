// 模拟历史版本API的数据和方法
// 在实际项目中，这些应该由后端API提供

// 模拟版本数据存储
let versionStorage = {};
let versionIdCounter = 1;

// 生成模拟版本数据
const generateMockVersion = (documentId, content, summary = '') => {
  const now = new Date();
  const versionNumber = (versionStorage[documentId]?.length || 0) + 1;
  
  return {
    id: versionIdCounter++,
    document_id: documentId,
    version_number: versionNumber,
    content: content,
    summary: summary || `版本 ${versionNumber}`,
    author: '当前用户',
    created_at: now.toISOString(),
    is_current: false
  };
};

// 模拟API方法
export const mockVersionAPI = {
  // 获取文档的历史版本列表
  getVersions: async (documentId) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
    
    const versions = versionStorage[documentId] || [];
    
    // 标记最新版本为当前版本
    if (versions.length > 0) {
      versions.forEach(v => v.is_current = false);
      versions[versions.length - 1].is_current = true;
    }
    
    return {
      code: 200,
      message: 'success',
      versions: versions.reverse() // 最新的在前面
    };
  },
  
  // 创建新版本
  createVersion: async (documentId, content, summary = '') => {
    await new Promise(resolve => setTimeout(resolve, 200)); // 模拟网络延迟
    
    if (!versionStorage[documentId]) {
      versionStorage[documentId] = [];
    }
    
    const newVersion = generateMockVersion(documentId, content, summary);
    versionStorage[documentId].push(newVersion);
    
    return {
      code: 200,
      message: 'Version created successfully',
      version: newVersion
    };
  },
  
  // 恢复到指定版本
  restoreVersion: async (documentId, versionId) => {
    await new Promise(resolve => setTimeout(resolve, 400)); // 模拟网络延迟
    
    const versions = versionStorage[documentId] || [];
    const targetVersion = versions.find(v => v.id === versionId);
    
    if (!targetVersion) {
      return {
        code: 404,
        message: 'Version not found'
      };
    }
    
    // 创建一个新版本作为恢复点
    const restoreVersion = generateMockVersion(
      documentId, 
      targetVersion.content, 
      `恢复到版本 ${targetVersion.version_number}`
    );
    
    versionStorage[documentId].push(restoreVersion);
    
    return {
      code: 200,
      message: 'Version restored successfully',
      version: restoreVersion
    };
  },
  
  // 清空版本历史（用于测试）
  clearVersions: (documentId) => {
    if (documentId) {
      delete versionStorage[documentId];
    } else {
      versionStorage = {};
      versionIdCounter = 1;
    }
  },
  
  // 获取版本存储状态（用于调试）
  getStorageState: () => {
    return {
      versionStorage,
      versionIdCounter
    };
  }
};

// 初始化一些示例数据
export const initMockData = (documentId) => {
  if (!versionStorage[documentId]) {
    versionStorage[documentId] = [];
    
    // 创建一些示例版本
    const sampleVersions = [
      {
        content: '<h1>文档标题</h1><p>这是第一个版本的内容。</p>',
        summary: '初始版本'
      },
      {
        content: '<h1>文档标题</h1><p>这是第一个版本的内容。</p><p>添加了第二段内容。</p>',
        summary: '添加内容'
      },
      {
        content: '<h1>更新的文档标题</h1><p>这是第一个版本的内容。</p><p>添加了第二段内容。</p><p>修改了标题。</p>',
        summary: '修改标题'
      }
    ];
    
    sampleVersions.forEach(({ content, summary }) => {
      const version = generateMockVersion(documentId, content, summary);
      versionStorage[documentId].push(version);
    });
  }
};

export default mockVersionAPI;