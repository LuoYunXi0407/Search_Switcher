// 搜索平台管理器模块
const PlatformManager = (() => {
// 默认搜索平台配置
const DEFAULT_PLATFORMS = [
  {
    id: "google",
    name: "Google",
    iconUrl: "icon/google.svg",
    urlTemplate: "https://www.google.com/search?q={searchTerm}",
    searchParam: "q",
    urlPattern: "*://www.google.com/search*"
  },
  {
    id: "bing",
    name: "Bing",
    iconUrl: "icon/bing.svg",
    urlTemplate: "https://www.bing.com/search?q={searchTerm}",
    searchParam: "q",
    urlPattern: "*://www.bing.com/search*"
  },
  {
    id: "baidu",
    name: "百度",
    iconUrl: "icon/Baidu.svg",
    urlTemplate: "https://www.baidu.com/s?wd={searchTerm}",
    searchParam: "wd",
    urlPattern: "*://www.baidu.com/s*"
  },
  {
    id: "youtube",
    name: "YouTube",
    iconUrl: "icon/Youtube.svg",
    urlTemplate: "https://www.youtube.com/results?search_query={searchTerm}",
    searchParam: "search_query",
    urlPattern: "*://www.youtube.com/results*"
  },
  {
    id: "bilibili",
    name: "哔哩哔哩",
    iconUrl: "icon/bilibili.svg",
    urlTemplate: "https://search.bilibili.com/all?keyword={searchTerm}",
    searchParam: "keyword",
    urlPattern: "*://search.bilibili.com/*"
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    iconUrl: "icon/小红书.svg",
    urlTemplate: "https://www.xiaohongshu.com/search_result?keyword={searchTerm}",
    searchParam: "keyword",
    urlPattern: "*://www.xiaohongshu.com/search_result*"
  },
  {
    id: "douyin",
    name: "抖音",
    iconUrl: "icon/抖音.svg",
    urlTemplate: "https://www.douyin.com/search/{searchTerm}",
    searchParam: null,
    urlPattern: "*://www.douyin.com/search/*"
  },
  {
    id: "smzdm",
    name: "什么值得买",
    iconUrl: "icon/smzdm.svg",
    urlTemplate: "https://search.smzdm.com/?s={searchTerm}",
    searchParam: "s",
    urlPattern: "*://search.smzdm.com/*"
  },
  {
    id: "taobao",
    name: "淘宝",
    iconUrl: "icon/淘宝.svg",
    urlTemplate: "https://s.taobao.com/search?q={searchTerm}",
    searchParam: "q",
    urlPattern: "*://s.taobao.com/search*"
  },
  {
    id: "jd",
    name: "京东",
    iconUrl: "icon/京东.svg",
    urlTemplate: "https://search.jd.com/Search?keyword={searchTerm}",
    searchParam: "keyword",
    urlPattern: "*://search.jd.com/Search*"
  },
  {
    id: "zhihu",
    name: "知乎",
    iconUrl: "icon/知乎.svg",
    urlTemplate: "https://www.zhihu.com/search?q={searchTerm}",
    searchParam: "q",
    urlPattern: "*://www.zhihu.com/search*"
  },
  {
    id: "douban",
    name: "豆瓣",
    iconUrl: "icon/豆瓣.svg",
    urlTemplate: "https://www.douban.com/search?q={searchTerm}",
    searchParam: "q",
    urlPattern: "*://www.douban.com/search*"
  }
];

  let allPlatforms = [];
  let currentPlatformId = null;
  let currentSearchTerm = '';
  let currentEditingPlatform = null;
  let hiddenDefaultPlatforms = [];

  // 加载所有平台
  const loadAllPlatforms = async () => {
    try {
      // 首先尝试初始化默认平台以确保即使发生错误也有数据可显示
      const defaultPlatforms = [...DEFAULT_PLATFORMS];
      
      // 加载内置平台
      try {
        const builtinPlatformsResponse = await fetch('data/platforms.json');
        const builtinPlatforms = await builtinPlatformsResponse.json();
        
        // 为内置平台添加id
        builtinPlatforms.forEach((platform, index) => {
          platform.id = 'builtin-' + index;
        });
        
        // 使用读取到的平台数据替换默认平台
        allPlatforms = [...builtinPlatforms];
      } catch(e) {
        console.warn('无法加载platforms.json，使用默认平台数据:', e);
        // 保持默认平台数据不变
        allPlatforms = [...defaultPlatforms];
      }
      
      // 加载用户修改的预设平台
      const modifiedData = await chrome.storage.local.get('modifiedDefaultPlatforms');
      const modifiedPlatforms = modifiedData.modifiedDefaultPlatforms || [];
      
      // 使用修改后的预设平台替换原始预设平台
      if (modifiedPlatforms.length > 0) {
        modifiedPlatforms.forEach(modifiedPlatform => {
          const index = allPlatforms.findIndex(p => p.id === modifiedPlatform.id);
          if (index !== -1) {
            allPlatforms[index] = modifiedPlatform;
          } else {
            allPlatforms.push(modifiedPlatform);
          }
        });
      }
      
      // 加载已删除的预设平台ID列表
      const hiddenData = await chrome.storage.local.get('hiddenDefaultPlatforms');
      hiddenDefaultPlatforms = hiddenData.hiddenDefaultPlatforms || [];
      
      // 从列表中移除被用户隐藏的平台
      if (hiddenDefaultPlatforms.length > 0) {
        allPlatforms = allPlatforms.filter(p => !hiddenDefaultPlatforms.includes(p.id));
      }
      
      // 加载自定义平台
      const data = await chrome.storage.local.get('customPlatforms');
      const customPlatforms = data.customPlatforms || [];
      
      // 合并平台
      allPlatforms = [...allPlatforms, ...customPlatforms];
      console.log('已加载平台数量:', allPlatforms.length);
    } catch (error) {
      console.error('加载平台数据失败:', error);
      // 确保至少有默认平台可用
      if (!allPlatforms.length) {
        allPlatforms = [...DEFAULT_PLATFORMS];
        console.log('使用默认平台数据');
      }
    }
  };

  // 保存修改后的预设平台
  const saveModifiedDefaultPlatform = async (platform) => {
    try {
      // 获取当前已修改的预设平台
      const data = await chrome.storage.local.get('modifiedDefaultPlatforms');
      let modifiedPlatforms = data.modifiedDefaultPlatforms || [];
      
      // 检查是否已经存在该平台
      const index = modifiedPlatforms.findIndex(p => p.id === platform.id);
      
      if (index !== -1) {
        // 更新现有平台
        modifiedPlatforms[index] = platform;
      } else {
        // 添加新的修改平台
        modifiedPlatforms.push(platform);
      }
      
      // 保存回存储
      await chrome.storage.local.set({ modifiedDefaultPlatforms: modifiedPlatforms });
      
      return true;
    } catch (error) {
      console.error('保存修改后的预设平台失败:', error);
      throw error;
    }
  };

  // 隐藏预设平台（等同于删除，但可恢复）
  const hideDefaultPlatform = async (platformId) => {
    try {
      if (!DEFAULT_PLATFORMS.some(p => p.id === platformId) && 
          !platformId.startsWith('builtin-')) {
        throw new Error('只能隐藏预设平台');
      }
      
      // 添加到隐藏列表
      if (!hiddenDefaultPlatforms.includes(platformId)) {
        hiddenDefaultPlatforms.push(platformId);
      }
      
      // 保存隐藏列表
      await chrome.storage.local.set({ hiddenDefaultPlatforms });
      
      // 从当前平台列表中移除
      const index = allPlatforms.findIndex(p => p.id === platformId);
      if (index !== -1) {
        allPlatforms.splice(index, 1);
      }
      
      return true;
    } catch (error) {
      console.error('隐藏预设平台失败:', error);
      throw error;
    }
  };

  // 恢复所有隐藏的预设平台
  const restoreAllHiddenPlatforms = async () => {
    try {
      // 清空隐藏列表
      hiddenDefaultPlatforms = [];
      await chrome.storage.local.set({ hiddenDefaultPlatforms: [] });
      
      // 重新加载所有平台
      await loadAllPlatforms();
      
      return true;
    } catch (error) {
      console.error('恢复隐藏平台失败:', error);
      throw error;
    }
  };

  // 恢复特定预设平台到默认状态
  const restoreDefaultPlatform = async (platformId) => {
    try {
      // 检查是否为预设平台ID
      const defaultPlatform = DEFAULT_PLATFORMS.find(p => p.id === platformId);
      if (!defaultPlatform && !platformId.startsWith('builtin-')) {
        throw new Error('只能恢复预设平台');
      }
      
      // 获取修改过的平台列表
      const data = await chrome.storage.local.get('modifiedDefaultPlatforms');
      let modifiedPlatforms = data.modifiedDefaultPlatforms || [];
      
      // 移除修改记录
      modifiedPlatforms = modifiedPlatforms.filter(p => p.id !== platformId);
      await chrome.storage.local.set({ modifiedDefaultPlatforms: modifiedPlatforms });
      
      // 如果该平台被隐藏，则从隐藏列表中移除
      if (hiddenDefaultPlatforms.includes(platformId)) {
        hiddenDefaultPlatforms = hiddenDefaultPlatforms.filter(id => id !== platformId);
        await chrome.storage.local.set({ hiddenDefaultPlatforms });
      }
      
      // 重新加载所有平台
      await loadAllPlatforms();
      
      return true;
    } catch (error) {
      console.error('恢复默认平台失败:', error);
      throw error;
    }
  };

  // 识别当前平台
  const identifyCurrentPlatform = (url) => {
    try {
      console.log('识别当前平台, URL:', url);
      
      // 如果没有URL，则设置当前平台为null
      if (!url) {
        console.log('无URL，无法识别平台');
        currentPlatformId = null;
        currentSearchTerm = '';
        return;
      }
      
      // 提取域名和搜索词
      let domain;
      try {
        domain = new URL(url).hostname;
        console.log('当前域名:', domain);
      } catch (e) {
        console.error('URL解析失败:', e);
        currentPlatformId = null;
        currentSearchTerm = '';
        return;
      }
      
      // 查找匹配的平台
      for (const platform of allPlatforms) {
        try {
          let platformUrl = platform.urlTemplate.replace('{searchTerm}', '');
          // 确保URL有协议前缀
          if (!platformUrl.startsWith('http')) {
            platformUrl = 'https://' + platformUrl;
          }
          
          const platformDomain = new URL(platformUrl).hostname;
          console.log(`比较平台 ${platform.name}: ${platformDomain} vs ${domain}`);
          
          if (domain === platformDomain) {
            currentPlatformId = platform.id;
            
            // 提取搜索词
      if (platform.searchParam) {
              const urlObj = new URL(url);
              currentSearchTerm = urlObj.searchParams.get(platform.searchParam) || '';
      } else if (platform.id === 'douyin') {
              // 特殊处理抖音等没有查询参数的平台
              const pathParts = new URL(url).pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'search') {
                currentSearchTerm = decodeURIComponent(pathParts[2]);
              }
            }
            
            console.log('当前平台已识别:', platform.name, '搜索词:', currentSearchTerm);
            return;
          }
        } catch (e) {
          console.warn('平台URL模板解析失败:', platform.name, e);
          continue;
        }
      }
      
      // 未找到匹配的平台
      currentPlatformId = null;
      currentSearchTerm = '';
      console.log('未识别到当前平台');
    } catch (error) {
      console.error('识别当前平台时出错:', error);
      currentPlatformId = null;
      currentSearchTerm = '';
    }
  };

  // 切换到指定平台
  const switchToPlatform = async (platform) => {
    try {
      // 如果没有搜索词，无法进行切换
      if (!currentSearchTerm) {
        alert('未能获取当前搜索词，无法切换平台');
        return;
      }
      
      // 如果点击的是当前平台，不需要切换
      if (currentPlatformId === platform.id) {
        return;
      }
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('无法获取当前标签页');
      }
      
      // 在URL模板中替换搜索词
      const targetUrl = platform.urlTemplate.replace('{searchTerm}', encodeURIComponent(currentSearchTerm));
      
      // 根据设置决定在新标签页打开还是当前标签页
      const settings = await SettingsManager.getSettings();
      
      if (settings.openInNewTab) {
        // 在新标签页打开
        await chrome.tabs.create({ url: targetUrl });
      } else {
        // 在当前标签页打开
        await chrome.tabs.update(tab.id, { url: targetUrl });
      }
      
      // 关闭弹出窗口
      window.close();
    } catch (error) {
      console.error('切换平台失败:', error);
      alert('切换平台失败: ' + error.message);
    }
  };
  
  // 更新平台排序并保存
  const updatePlatformOrder = (orderedIds) => {
    // 获取新的平台顺序
    const orderedPlatforms = [];
    for (const id of orderedIds) {
      const platform = allPlatforms.find(p => p.id === id);
      if (platform) {
        orderedPlatforms.push(platform);
      }
    }
    
    // 更新平台数组
    allPlatforms = orderedPlatforms;
    
    // 保存到本地存储
    chrome.storage.local.set({ platformOrder: orderedIds });
  };
  
  // 保存平台
  const saveCustomPlatform = async (name, urlTemplate, iconFile, editId = null) => {
    // 验证输入
    if (!name || !urlTemplate) {
      throw new Error('请填写平台名称和URL模板');
    }
    
    if (!urlTemplate.includes('{searchTerm}')) {
      throw new Error('URL模板必须包含 {searchTerm} 占位符');
    }
    
    // 读取图标（如果上传）
    let iconUrl = null;
    if (iconFile) {
      try {
        iconUrl = await Utils.readFileAsDataURL(iconFile);
      } catch (error) {
        throw new Error('读取图标文件失败: ' + error.message);
      }
    }
    
    // 判断是编辑默认平台还是自定义平台
    const isDefaultPlatform = editId && (
      DEFAULT_PLATFORMS.some(p => p.id === editId) || 
      editId.startsWith('builtin-')
    );
    
    try {
      if (isDefaultPlatform) {
        // 编辑默认平台
        const platform = allPlatforms.find(p => p.id === editId);
        if (!platform) {
          throw new Error('找不到要编辑的平台');
        }
        
        // 创建修改后的平台对象
        const modifiedPlatform = {
          ...platform,
          name,
          urlTemplate,
        };
        
        // 如果上传了新图标，则更新图标
        if (iconUrl) {
          modifiedPlatform.iconUrl = iconUrl;
        }
        
        // 保存修改后的默认平台
        await saveModifiedDefaultPlatform(modifiedPlatform);
        
        // 更新allPlatforms中的平台
        const index = allPlatforms.findIndex(p => p.id === editId);
        if (index !== -1) {
          allPlatforms[index] = modifiedPlatform;
        }
      } else if (editId) {
        // 编辑现有自定义平台
        // 获取所有自定义平台
        const data = await chrome.storage.local.get('customPlatforms');
        const customPlatforms = data.customPlatforms || [];
        
        // 找到要更新的平台索引
        const platformIndex = customPlatforms.findIndex(p => p.id === editId);
        if (platformIndex === -1) {
          throw new Error('找不到要编辑的平台');
        }
        
        // 准备要更新的数据
        const updatedPlatform = {
          ...customPlatforms[platformIndex],
          name,
          urlTemplate,
        };
        
        // 如果上传了新图标，则更新图标
        if (iconUrl) {
          updatedPlatform.iconUrl = iconUrl;
        }
        
        // 更新数据
        customPlatforms[platformIndex] = updatedPlatform;
        await chrome.storage.local.set({ customPlatforms });
        
        // 更新allPlatforms中的平台
        const index = allPlatforms.findIndex(p => p.id === editId);
        if (index !== -1) {
          allPlatforms[index] = updatedPlatform;
        }
      } else {
        // 创建新的自定义平台
        const id = Utils.generateId();
        
        // 使用默认图标（如果没有上传）
        if (!iconUrl) {
          iconUrl = 'images/icon48.png';
        }
        
        // 创建自定义平台对象
        const customPlatform = {
          id,
          name,
          iconUrl,
          urlTemplate,
          searchParam: null,
          urlPattern: null
        };
        
        // 获取现有自定义平台
        const data = await chrome.storage.local.get('customPlatforms');
        const customPlatforms = data.customPlatforms || [];
        
        // 添加到数组
        customPlatforms.push(customPlatform);
        await chrome.storage.local.set({ customPlatforms });
        
        // 添加到allPlatforms
        allPlatforms.push(customPlatform);
      }
      
      return true;
    } catch (error) {
      throw Utils.handleError('保存平台', error);
    }
  };

  // 删除平台
  const deletePlatform = async (platformId) => {
    if (!platformId) return false;
    
    try {
      // 判断是默认平台还是自定义平台
      const isDefaultPlatform = DEFAULT_PLATFORMS.some(p => p.id === platformId) || 
                              platformId.startsWith('builtin-');
      
      if (isDefaultPlatform) {
        // 对于默认平台，我们执行隐藏操作
        return await hideDefaultPlatform(platformId);
      } else {
        // 对于自定义平台，执行删除操作
      // 获取所有自定义平台
      const data = await chrome.storage.local.get('customPlatforms');
      const customPlatforms = data.customPlatforms || [];
      
      // 找到要删除的平台索引
      const platformIndex = customPlatforms.findIndex(p => p.id === platformId);
      if (platformIndex === -1) {
          throw new Error('找不到要删除的平台');
      }
      
      // 从数组中移除
      customPlatforms.splice(platformIndex, 1);
      
      // 保存更新后的数据
      await chrome.storage.local.set({ customPlatforms });
      
      // 从allPlatforms中移除
        const index = allPlatforms.findIndex(p => p.id === platformId);
      if (index !== -1) {
          allPlatforms.splice(index, 1);
        }
        
        return true;
      }
    } catch (error) {
      console.error('删除平台失败:', error);
      throw error;
    }
  };

  // 判断平台是否为预设平台
  const isDefaultPlatform = (platformId) => {
    return DEFAULT_PLATFORMS.some(p => p.id === platformId) || 
           platformId.startsWith('builtin-');
  };

  // 公开接口
  return {
    loadAllPlatforms,
    identifyCurrentPlatform,
    switchToPlatform,
    updatePlatformOrder,
    saveCustomPlatform,
    deletePlatform,
    restoreAllHiddenPlatforms,
    restoreDefaultPlatform,
    isDefaultPlatform,
    getCurrentPlatform: () => allPlatforms.find(p => p.id === currentPlatformId),
    getAllPlatforms: () => [...allPlatforms],
    getCurrentPlatformId: () => currentPlatformId,
    getCurrentSearchTerm: () => currentSearchTerm,
    setCurrentEditingPlatform: (platform) => { currentEditingPlatform = platform; },
    getCurrentEditingPlatform: () => currentEditingPlatform,
    getHiddenDefaultPlatformCount: () => hiddenDefaultPlatforms.length
  };
})();

// 设置管理器模块
const SettingsManager = (() => {
  // 默认设置
  const defaultSettings = {
    openInNewTab: false
  };
  
  // 当前设置
  let settings = {...defaultSettings};
  
  // 获取设置
  const loadSettings = async () => {
    try {
      const data = await chrome.storage.local.get('settings');
      if (data.settings) {
        settings = {...defaultSettings, ...data.settings};
      }
      console.log('已加载设置:', settings);
      return settings;
    } catch (error) {
      console.error('加载设置失败:', error);
      return defaultSettings;
    }
  };
  
  // 保存设置
  const saveSettings = async (newSettings) => {
    try {
      settings = {...settings, ...newSettings};
      await chrome.storage.local.set({ 'settings': settings });
      console.log('设置已保存', settings);
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  };
  
  // 切换新标签页设置
  const toggleOpenInNewTab = async () => {
    const newValue = !settings.openInNewTab;
    return await saveSettings({ openInNewTab: newValue });
  };
  
  // 公开接口
  return {
    loadSettings,
    saveSettings,
    toggleOpenInNewTab,
    getSettings: () => ({...settings})
  };
})();

// 工具函数模块
const Utils = (() => {
  // 生成唯一ID
  const generateId = () => {
    return 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  };
  
  // 从文件读取数据URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    });
  };
  
  // 防抖函数
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };
  
  // 统一错误处理
  const handleError = (operation, error) => {
    console.error(`${operation}失败:`, error);
    
    // 确保有一个用户友好的错误消息
    const message = error.message || `执行${operation}时出错`;
    alert(message);
    
    // 返回错误对象以便调用者可以进一步处理
    return error;
  };
  
  // 异步操作包装器，统一处理错误
  const safeAsync = (operation, func) => {
    return async (...args) => {
      try {
        return await func(...args);
      } catch (error) {
        handleError(operation, error);
        throw error; // 重新抛出以允许调用者知道操作失败
      }
    };
  };
  
  // 公开接口
  return {
    generateId,
    readFileAsDataURL,
    debounce,
    handleError,
    safeAsync
  };
})();

// 事件管理器模块
const EventManager = (() => {
  // 存储事件处理器
  const eventHandlers = {};
  
  // 添加事件监听器
  const addListener = (element, eventType, handler, namespace) => {
    if (!element) return;
    
    // 创建带命名空间的唯一键
    const key = `${eventType}-${namespace || 'default'}`;
    
    // 移除同一命名空间下的旧事件处理器
    removeListener(element, eventType, namespace);
    
    // 保存事件处理器引用
    if (!eventHandlers[key]) {
      eventHandlers[key] = [];
    }
    
    eventHandlers[key].push({ element, handler });
    element.addEventListener(eventType, handler);
  };
  
  // 移除事件监听器
  const removeListener = (element, eventType, namespace) => {
    if (!element) return;
    
    const key = `${eventType}-${namespace || 'default'}`;
    const handlers = eventHandlers[key] || [];
    
    // 移除该元素上指定命名空间的所有处理器
    handlers.forEach(entry => {
      if (entry.element === element) {
        element.removeEventListener(eventType, entry.handler);
      }
    });
    
    // 清理状态
    eventHandlers[key] = handlers.filter(entry => entry.element !== element);
  };
  
  // 清理所有特定命名空间的事件处理器
  const clearNamespace = (namespace) => {
    if (!namespace) return;
    
    Object.keys(eventHandlers).forEach(key => {
      if (key.endsWith(`-${namespace}`)) {
        eventHandlers[key].forEach(entry => {
          entry.element.removeEventListener(key.split('-')[0], entry.handler);
        });
        eventHandlers[key] = [];
      }
    });
  };
  
  // 公开接口
  return {
    addListener,
    removeListener,
    clearNamespace
  };
})();

// 全局状态
const state = {
  currentPlatformId: null,
  allPlatforms: [],
  currentSearchTerm: '',  // 添加搜索词状态
  currentEditingPlatform: null,
  draggedItem: null,
  settings: {
    openInNewTab: false,
  },
  // 用于存储事件处理器
  eventHandlers: {}
};

// DOM缓存
const DOM = {};

// DOM 界面控制器模块
const UIController = (() => {
  // DOM元素缓存
  const domElements = {};
  
  // 缓存DOM元素
  const cacheDOMElements = () => {
    domElements.appContainer = document.getElementById('app');
    domElements.formContainer = document.getElementById('custom-platform-form');
    domElements.formTitle = document.querySelector('#custom-platform-form .form-header h3');
    domElements.currentPlatformItem = document.getElementById('current-platform-item');
    domElements.platformList = document.getElementById('all-platforms');
    
    domElements.addButton = document.getElementById('add-platform-btn');
    domElements.backButton = document.getElementById('back-btn');
    domElements.saveButton = document.getElementById('save-platform');
    domElements.deleteButton = document.getElementById('delete-platform');
    
    domElements.platformNameInput = document.getElementById('platform-name');
    domElements.platformUrlInput = document.getElementById('platform-url');
    domElements.platformIconInput = document.getElementById('platform-icon');
    
    // 设置相关元素
    domElements.settingsButton = document.getElementById('settings-btn');
    domElements.settingsPopup = document.getElementById('settings-popup');
    domElements.newTabSwitch = document.getElementById('new-tab-switch');
    domElements.newTabSwitchImg = document.getElementById('new-tab-switch-img');
  };
  
  // 设置事件监听
  const setupEventListeners = () => {
    // 清除所有旧事件处理器
    EventManager.clearNamespace('ui');
    
    // 设置按钮点击
    if (domElements.settingsButton) {
      EventManager.addListener(domElements.settingsButton, 'click', (e) => {
        e.stopPropagation();
        const isVisible = domElements.settingsPopup.style.display === 'block';
        domElements.settingsPopup.style.display = isVisible ? 'none' : 'block';
      }, 'ui');
    }
    
    // 设置菜单点击阻止冒泡
    if (domElements.settingsPopup) {
      EventManager.addListener(domElements.settingsPopup, 'click', (e) => {
        e.stopPropagation();
      }, 'ui');
    }
    
    // 点击页面其他区域关闭设置菜单
    EventManager.addListener(document, 'click', () => {
      if (domElements.settingsPopup && domElements.settingsPopup.style.display === 'block') {
        domElements.settingsPopup.style.display = 'none';
      }
    }, 'ui');
    
    // 添加按钮
    if (domElements.addButton) {
      EventManager.addListener(domElements.addButton, 'click', () => {
        if (domElements.settingsPopup) {
          domElements.settingsPopup.style.display = 'none';
        }
        resetCustomPlatformForm();
        domElements.appContainer.style.display = 'none';
        domElements.formContainer.style.display = 'block';
      }, 'ui');
    }
    
    // 返回按钮
    if (domElements.backButton) {
      EventManager.addListener(domElements.backButton, 'click', resetCustomPlatformForm, 'ui');
    }
    
    // 保存按钮
    if (domElements.saveButton) {
      EventManager.addListener(domElements.saveButton, 'click', async (event) => {
        try {
          event.preventDefault();
          console.log('保存按钮被点击');
          
          const name = domElements.platformNameInput.value.trim();
          const urlTemplate = domElements.platformUrlInput.value.trim();
          const iconFile = domElements.platformIconInput.files.length > 0 
            ? domElements.platformIconInput.files[0] 
            : null;
          
          // 编辑模式
          const isEditMode = domElements.saveButton.dataset.mode === 'edit';
          const editId = isEditMode ? domElements.saveButton.dataset.editId : null;
          
          await PlatformManager.saveCustomPlatform(name, urlTemplate, iconFile, editId);
          
          // 重新渲染平台列表
          renderPlatforms();
          
          // 重置表单并返回主界面
          resetCustomPlatformForm();
        } catch (error) {
          console.error('处理保存按钮点击时出错:', error);
          alert(error.message || '保存失败');
        }
      }, 'saveBtn');
    }
    
    // 新标签页开关
    if (domElements.newTabSwitch) {
      EventManager.addListener(domElements.newTabSwitch, 'click', async (e) => {
        // 添加点击动画效果
        domElements.newTabSwitch.classList.add('active');
        
        try {
          // 应用过渡效果：先淡出
          domElements.newTabSwitchImg.style.opacity = '0';
          domElements.newTabSwitchImg.style.transform = 'scale(0.8)';
          
          // 切换设置状态
          await SettingsManager.toggleOpenInNewTab();
          const settings = SettingsManager.getSettings();
          
          // 等待淡出动画完成
          setTimeout(() => {
            // 更新开关图标
            domElements.newTabSwitchImg.src = settings.openInNewTab 
              ? 'icon/switch-on.svg' 
              : 'icon/switch-off.svg';
            
            // 淡入新状态
            domElements.newTabSwitchImg.style.opacity = '1';
            domElements.newTabSwitchImg.style.transform = 'scale(1)';
            
            // 移除活跃状态
            setTimeout(() => {
              domElements.newTabSwitch.classList.remove('active');
            }, 200);
          }, 150);
        } catch (error) {
          console.error('切换设置失败:', error);
          domElements.newTabSwitch.classList.remove('active');
          domElements.newTabSwitchImg.style.opacity = '1';
          domElements.newTabSwitchImg.style.transform = 'scale(1)';
        }
      }, 'ui');
      
      // 为开关图片也添加点击事件
      if (domElements.newTabSwitchImg) {
        EventManager.addListener(domElements.newTabSwitchImg, 'click', (e) => {
          e.stopPropagation();
          domElements.newTabSwitch.click();
        }, 'ui');
      }
    }
  };
  
  // 设置删除按钮的事件处理
  const setupDeleteButton = (platformId, platformName) => {
    if (!domElements.deleteButton) return;
    
    // 清理旧事件处理器
    EventManager.removeListener(domElements.deleteButton, 'click', 'deleteBtn');
    
    if (platformId) {
      // 显示并设置删除按钮数据
      domElements.deleteButton.dataset.id = platformId;
      domElements.deleteButton.dataset.name = platformName;
      domElements.deleteButton.style.display = 'block';
      
      // 添加新的事件处理器
      EventManager.addListener(
        domElements.deleteButton, 
        'click', 
        async (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();
            
            const deleteBtn = e.currentTarget;
            const id = deleteBtn.dataset.id;
            const name = deleteBtn.dataset.name;
            
            if (!id) {
              console.error('无法删除：没有平台ID');
              return;
            }
            
            const confirmDelete = confirm(`确定要删除平台"${name || '未命名'}"吗？`);
            
            if (confirmDelete) {
              await PlatformManager.deletePlatform(id);
              renderPlatforms();
              resetCustomPlatformForm();
            }
          } catch (error) {
            console.error('删除操作失败:', error);
            alert('删除失败: ' + error.message);
          }
        }, 
        'deleteBtn'
      );
    } else {
      // 隐藏删除按钮
      domElements.deleteButton.style.display = 'none';
      delete domElements.deleteButton.dataset.id;
      delete domElements.deleteButton.dataset.name;
    }
  };

  // 重置自定义平台表单
  const resetCustomPlatformForm = () => {
    // 重置当前编辑的平台
    PlatformManager.setCurrentEditingPlatform(null);
    
    // 重置输入字段
    if (domElements.platformNameInput) domElements.platformNameInput.value = '';
    if (domElements.platformUrlInput) domElements.platformUrlInput.value = '';
    if (domElements.platformIconInput) domElements.platformIconInput.value = '';
    
    // 重置表单标题
    if (domElements.formTitle) domElements.formTitle.textContent = '添加自定义平台';
    
    // 重置保存按钮
    if (domElements.saveButton) {
      domElements.saveButton.textContent = '保存';
      domElements.saveButton.dataset.mode = 'add';
      delete domElements.saveButton.dataset.editId;
      
      // 移除保存按钮的特定事件监听器
      EventManager.removeListener(domElements.saveButton, 'click', 'saveBtn');
      
      // 添加默认的保存处理函数
      EventManager.addListener(domElements.saveButton, 'click', async (event) => {
        try {
          event.preventDefault();
          
          const name = domElements.platformNameInput.value.trim();
          const urlTemplate = domElements.platformUrlInput.value.trim();
          const iconFile = domElements.platformIconInput.files.length > 0 
            ? domElements.platformIconInput.files[0] 
            : null;
          
          await PlatformManager.saveCustomPlatform(name, urlTemplate, iconFile);
          
          // 重新渲染平台列表
          renderPlatforms();
          
          // 重置表单并返回主界面
          resetCustomPlatformForm();
        } catch (error) {
          console.error('处理保存按钮点击时出错:', error);
          alert(error.message || '保存失败');
        }
      }, 'saveBtn');
    }
    
    // 重置删除按钮
    setupDeleteButton(null);
    
    // 返回主界面
    if (domElements.appContainer) domElements.appContainer.style.display = 'block';
    if (domElements.formContainer) domElements.formContainer.style.display = 'none';
  };
  
  // 准备编辑自定义平台
  const prepareEditPlatform = (platform) => {
    // 保存当前编辑的平台
    PlatformManager.setCurrentEditingPlatform(platform);
    
    // 设置表单为编辑模式
    domElements.appContainer.style.display = 'none';
    domElements.formContainer.style.display = 'block';
    
    // 更新表单标题
    domElements.formTitle.textContent = '编辑平台';
    
    // 设置保存按钮为编辑模式
    domElements.saveButton.textContent = '更新';
    domElements.saveButton.dataset.mode = 'edit';
    domElements.saveButton.dataset.editId = platform.id;
    
    // 设置删除按钮
    setupDeleteButton(platform.id, platform.name);
    
    // 填充表单
    domElements.platformNameInput.value = platform.name;
    domElements.platformUrlInput.value = platform.urlTemplate;
    
    // 移除旧事件处理器并添加新处理器
    EventManager.removeListener(domElements.saveButton, 'click', 'saveBtn');
    EventManager.addListener(domElements.saveButton, 'click', async (e) => {
      try {
        e.preventDefault();
        
        const name = domElements.platformNameInput.value.trim();
        const urlTemplate = domElements.platformUrlInput.value.trim();
        const iconFile = domElements.platformIconInput.files.length > 0 
          ? domElements.platformIconInput.files[0] 
          : null;
        
        await PlatformManager.saveCustomPlatform(name, urlTemplate, iconFile, platform.id);
        
        // 重新渲染平台列表
        renderPlatforms();
        
        // 重置表单
        resetCustomPlatformForm();
      } catch (error) {
        console.error('更新平台失败:', error);
        alert(error.message || '更新失败');
      }
    }, 'saveBtn');
  };
  
  // 创建平台元素
  const createPlatformElement = (platform, isCurrent = false) => {
    const element = document.createElement('div');
    element.className = `platform-item ${isCurrent ? 'current' : ''}`;
    element.dataset.id = platform.id;
    element.dataset.urlTemplate = platform.urlTemplate;
    element.style.width = 'calc(50% - 6px)';
    
    // 添加拖拽属性
    element.draggable = true;
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragend', handleDragEnd);
    
    // 拖拽图标
    const dragIcon = document.createElement('div');
    dragIcon.className = 'drag-icon';
    dragIcon.innerHTML = '≡';
    
    // 平台内容容器
    const contentElement = document.createElement('div');
    contentElement.className = 'platform-content';
    
    const iconElement = document.createElement('img');
    iconElement.className = 'platform-icon';
    iconElement.src = platform.iconUrl;
    iconElement.alt = platform.name;
    
    const nameElement = document.createElement('span');
    nameElement.className = 'platform-name';
    nameElement.textContent = platform.name;
    
    contentElement.appendChild(iconElement);
    contentElement.appendChild(nameElement);
    
    element.appendChild(dragIcon);
    element.appendChild(contentElement);
    
    // 为所有平台添加编辑按钮，不再限制只有自定义平台
      const actionsElement = document.createElement('div');
      actionsElement.className = 'platform-actions';
      
      const editButton = document.createElement('button');
      editButton.className = 'action-btn edit-btn';
      editButton.title = '编辑';
      
      // 使用edit.svg图标
      const editIcon = document.createElement('img');
      editIcon.src = 'icon/edit.svg';
      editIcon.className = 'edit-icon';
      editIcon.alt = '编辑';
      editButton.appendChild(editIcon);
      
      editButton.addEventListener('click', (e) => {
        e.stopPropagation();
      prepareEditPlatform(platform);
      });
      
      actionsElement.appendChild(editButton);
      element.appendChild(actionsElement);
    
    if (!isCurrent) {
      element.addEventListener('click', () => PlatformManager.switchToPlatform(platform));
    }
    
    return element;
  };
  
  // 渲染当前平台
  const renderCurrentPlatform = () => {
    domElements.currentPlatformItem.innerHTML = '';
    
    const currentPlatformId = PlatformManager.getCurrentPlatformId();
    if (!currentPlatformId) {
      domElements.currentPlatformItem.textContent = '未识别到搜索平台';
      return;
    }
    
    // 查找当前平台对象
    const currentPlatform = PlatformManager.getCurrentPlatform();
    
    if (!currentPlatform) {
      domElements.currentPlatformItem.textContent = '未识别到搜索平台';
      return;
    }
    
    // 创建简单的平台显示元素
    const element = document.createElement('div');
    element.className = 'platform-display';
    
    const iconElement = document.createElement('img');
    iconElement.className = 'platform-icon';
    iconElement.src = currentPlatform.iconUrl;
    iconElement.alt = currentPlatform.name;
    
    const nameElement = document.createElement('span');
    nameElement.className = 'platform-name';
    nameElement.textContent = currentPlatform.name;
    
    element.appendChild(iconElement);
    element.appendChild(nameElement);
    
    domElements.currentPlatformItem.appendChild(element);
  };
  
  // 渲染所有平台
  const renderPlatforms = () => {
    try {
      console.log('开始渲染平台列表');
      
      // 渲染当前平台
      renderCurrentPlatform();
      
      // 渲染所有平台
      if (domElements.platformList) {
        domElements.platformList.innerHTML = '';
        
        const allPlatforms = PlatformManager.getAllPlatforms();
        const currentPlatformId = PlatformManager.getCurrentPlatformId();
        
        // 如果没有平台数据，显示提示信息
        if (!allPlatforms.length) {
          const noDataElement = document.createElement('div');
          noDataElement.className = 'no-data-message';
          noDataElement.textContent = '未能加载平台数据';
          domElements.platformList.appendChild(noDataElement);
          return;
        }
        
        // 过滤掉当前平台
        const platformsToRender = allPlatforms.filter(platform => platform.id !== currentPlatformId);
        console.log('待渲染平台数量:', platformsToRender.length);
        
        if (platformsToRender.length === 0) {
          const noOtherPlatformsElement = document.createElement('div');
          noOtherPlatformsElement.className = 'no-data-message';
          noOtherPlatformsElement.textContent = '没有其他可切换的平台';
          domElements.platformList.appendChild(noOtherPlatformsElement);
          return;
        }
        
        // 创建并添加平台元素
        for (const platform of platformsToRender) {
          try {
            const platformElement = createPlatformElement(platform);
            domElements.platformList.appendChild(platformElement);
          } catch (err) {
            console.error('渲染平台元素失败:', platform, err);
          }
        }
      } else {
        console.error('domElements.platformList不存在，无法渲染平台列表');
      }
    } catch (error) {
      console.error('渲染平台列表时出错:', error);
    }
  };
  
  // 更新设置界面
  const updateSettingsUI = () => {
    const settings = SettingsManager.getSettings();
    if (domElements.newTabSwitchImg) {
      // 确保开关有正确的初始样式
      domElements.newTabSwitchImg.style.opacity = '1';
      domElements.newTabSwitchImg.style.transform = 'scale(1)';
      
      // 设置正确的图标
      domElements.newTabSwitchImg.src = settings.openInNewTab 
        ? 'icon/switch-on.svg' 
        : 'icon/switch-off.svg';
    }
  };
  
  // 重置界面状态（用于弹出窗口重新打开时）
  const resetPopupState = () => {
    if (domElements.appContainer) domElements.appContainer.style.display = 'block';
    if (domElements.formContainer) domElements.formContainer.style.display = 'none';
    if (domElements.settingsPopup) domElements.settingsPopup.style.display = 'none';
    
    // 重置表单状态
    if (domElements.saveButton) {
      domElements.saveButton.textContent = '保存';
      domElements.saveButton.dataset.mode = 'add';
      delete domElements.saveButton.dataset.editId;
    }
    
    // 重置删除按钮
    setupDeleteButton(null);
    
    // 将当前状态保存到会话存储
    sessionStorage.setItem('popupState', 'home');
  };
  
  // 拖拽相关变量和函数
  let draggedItem = null;
  
  // 拖拽开始
  const handleDragStart = function(e) {
    draggedItem = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
      this.classList.add('dragging');
      
      setTimeout(() => {
        this.style.opacity = '0.7';
      }, 0);
  };

  // 拖拽经过
  const handleDragOver = function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      return false;
  };

  // 拖拽进入
  const handleDragEnter = function() {
      this.classList.add('drag-over');
  };

  // 拖拽离开
  const handleDragLeave = function() {
      this.classList.remove('drag-over');
  };

  // 放置
  const handleDrop = function(e) {
      e.stopPropagation();
      e.preventDefault();
      
    if (draggedItem !== this) {
      const container = domElements.platformList;
        const items = Array.from(container.children);
      const draggedIndex = items.indexOf(draggedItem);
        const targetIndex = items.indexOf(this);
        
        // 交换平台顺序
        if (draggedIndex < targetIndex) {
        container.insertBefore(draggedItem, this.nextSibling);
        } else {
        container.insertBefore(draggedItem, this);
        }
        
        // 更新平台顺序
      const newOrder = Array.from(container.querySelectorAll('.platform-item')).map(item => item.dataset.id);
      PlatformManager.updatePlatformOrder(newOrder);
      }
      
      this.classList.remove('drag-over');
    draggedItem.style.opacity = '1';
      return false;
  };

  // 拖拽结束
  const handleDragEnd = function() {
      this.classList.remove('dragging');
      this.style.opacity = '1';
      
      const items = document.querySelectorAll('.platform-item');
      items.forEach(item => {
        item.classList.remove('drag-over');
        item.style.opacity = '1';
      });
  };
  
  // 公开接口
  return {
    cacheDOMElements,
    setupEventListeners,
    renderPlatforms,
    updateSettingsUI,
    resetPopupState
  };
})();

// 初始化应用
async function init() {
  try {
    // 缓存DOM元素
    UIController.cacheDOMElements();
    
    // 获取当前选项卡的URL
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const url = tab ? tab.url : '';
    
    // 获取所有平台数据
    await PlatformManager.loadAllPlatforms();
    
    // 识别当前平台
    PlatformManager.identifyCurrentPlatform(url);
    
    // 渲染平台
    UIController.renderPlatforms();
    
    // 获取设置
    await SettingsManager.loadSettings();
    
    // 更新设置UI
    UIController.updateSettingsUI();
    
    // 设置事件监听器
    UIController.setupEventListeners();
  } catch (error) {
    Utils.handleError('初始化应用', error);
  }
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 使用Chrome扩展API特性，建立与background的连接
const port = chrome.runtime.connect({name: "popup"});

// 给扩展弹窗添加特殊处理，确保每次打开都显示主页面
window.addEventListener('load', function() {
  console.log('弹窗加载');
  // 重置界面状态
  UIController.resetPopupState();
});

// 检测页面可见性变化（针对popup特殊处理）
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    // 当页面变为可见时重置界面并刷新数据
    UIController.resetPopupState();
    init();
  }
});

// 在关闭和重新打开扩展时执行的处理
chrome.runtime.connect().onDisconnect.addListener(function() {
  // 清理所有事件处理器
  EventManager.clearNamespace('ui');
  EventManager.clearNamespace('saveBtn');
  EventManager.clearNamespace('deleteBtn');
}); 