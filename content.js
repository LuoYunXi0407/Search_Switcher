// 内容脚本模块
const ContentScript = (() => {
  // 私有变量
  let lastUrl = location.href;
  
  // 创建悬浮按钮
  const createFloatingButton = () => {
    // 检查是否已存在按钮
    if (document.getElementById('search-switcher-btn')) {
      return;
    }
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'search-switcher-btn';
    buttonContainer.className = 'search-switcher-container';
    
    // 初始位置设置 - 从存储中获取或使用默认值
    chrome.storage.local.get('buttonPosition', (data) => {
      const position = data.buttonPosition || { right: '20px', bottom: '80px' };
      
      // 确保位置总是在右侧边缘
      position.right = '0px';
      position.left = 'auto';
      
      // 应用位置
      Object.assign(buttonContainer.style, position);
      
      // 设置右侧边缘类
      buttonContainer.classList.add('edge-right');
    });
    
    // 创建按钮
    const button = document.createElement('div');
    button.className = 'search-switcher-icon';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', '搜索切换');
    
    // 获取当前系统是否为暗色模式
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 根据暗色模式设置颜色
    if (isDarkMode) {
      button.style.backgroundColor = '#222222';
      button.style.borderColor = '#444444';
    } else {
      button.style.backgroundColor = '#ffffff';
      button.style.borderColor = '#eeeeee';
    }
    
    // 创建图标
    const iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL('icon/icon48.png');
    iconImg.style.width = '20px';
    iconImg.style.height = '20px';
    iconImg.alt = '搜索切换';
    button.appendChild(iconImg);
    
    // 添加点击事件
    button.addEventListener('click', togglePopup);
    
    // 添加拖拽功能
    makeDraggable(buttonContainer, button);
    
    // 将按钮添加到容器
    buttonContainer.appendChild(button);
    
    // 创建弹出窗口容器
    const popupContainer = document.createElement('div');
    popupContainer.id = 'search-switcher-popup';
    popupContainer.className = 'search-switcher-popup';
    popupContainer.style.display = 'none';
    
    // 添加弹出窗口内嵌框架
    const popupFrame = document.createElement('iframe');
    popupFrame.id = 'search-switcher-iframe';
    popupFrame.src = chrome.runtime.getURL('popup.html');
    popupFrame.className = 'search-switcher-iframe';
    
    // 将框架添加到弹出窗口
    popupContainer.appendChild(popupFrame);
    
    // 将按钮和弹出窗口添加到页面
    buttonContainer.appendChild(popupContainer);
    document.body.appendChild(buttonContainer);
    
    // 添加全局点击事件，用于关闭弹出窗口
    document.addEventListener('click', (e) => {
      const container = document.getElementById('search-switcher-btn');
      const popup = document.getElementById('search-switcher-popup');
      
      if (container && !container.contains(e.target) && popup && popup.style.display === 'block') {
        popup.style.display = 'none';
      }
    });
  };
  
  // 使元素可拖拽
  const makeDraggable = (container, handle) => {
    // 拖拽状态
    let isDragging = false;
    let startX, startY;
    let startRight, startBottom;
    let lastClick = 0;
    
    // 保存最后的位置
    function savePosition() {
      const position = {
        right: container.style.right,
        bottom: container.style.bottom
      };
      chrome.storage.local.set({ buttonPosition: position });
    }
    
    // 限制位置在窗口边缘
    function constrainToWindowEdge(el) {
      // 强制固定在右侧边缘
      container.style.right = '0px';
      container.style.left = 'auto';
      
      // 移除所有其他边缘样式类，只保留右侧边缘类
      container.classList.remove('edge-left', 'edge-top', 'edge-bottom');
      container.classList.add('edge-right');
      
      // 保存当前位置
      savePosition();
    }
    
    // 鼠标按下事件
    handle.addEventListener('mousedown', (e) => {
      // 检测是否是双击（双击不触发拖动）
      const now = new Date().getTime();
      if (now - lastClick < 300) {
        // 双击，不处理拖动
        lastClick = 0;
        return;
      }
      lastClick = now;
      
      // 如果弹出窗口打开，则不开始拖动
      const popup = document.getElementById('search-switcher-popup');
      if (popup && popup.style.display === 'block') {
        return;
      }
      
      e.preventDefault();
      isDragging = true;
      
      // 记录起始位置
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = container.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;
      
      // 添加拖动样式
      container.classList.add('dragging');
    });
    
    // 鼠标移动事件（全局）
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      // 计算Y轴的变化，只允许上下移动
      const deltaY = startY - e.clientY;
      const newBottom = startBottom + deltaY;
      
      // 更新位置，只修改垂直位置，保持右侧固定
      container.style.bottom = `${Math.max(20, Math.min(window.innerHeight - 60, newBottom))}px`;
      
      // 确保始终在右侧
      container.style.right = '0px';
      container.style.left = 'auto';
    });
    
    // 鼠标释放事件（全局）
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        
        // 移除拖动样式
        container.classList.remove('dragging');
        
        // 吸附到边缘
        constrainToWindowEdge(container);
      }
    });
    
    // 鼠标离开窗口事件
    document.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('dragging');
        constrainToWindowEdge(container);
      }
    });
  };
  
  // 切换弹出窗口显示状态
  const togglePopup = () => {
    const popup = document.getElementById('search-switcher-popup');
    
    // 直接设置显示状态，不使用过渡动画
    if (popup.style.display === 'none') {
      popup.style.display = 'block';
      // 确保无动画效果
      popup.style.transition = 'none';
      // 在下一帧恢复过渡效果(用于关闭时)
      requestAnimationFrame(() => {
        popup.style.transition = '';
      });
    } else {
      popup.style.display = 'none';
    }
  };
  
  // 检测搜索平台
  const detectSearchPlatform = () => {
    const url = window.location.href;
    console.log("当前URL:", url);
  
    // 京东特殊处理
    if (url.includes("search.jd.com")) {
      console.log("检测到京东搜索页面");
      return true;
    }
    
    // 淘宝特殊处理
    if (url.includes("s.taobao.com") || url.includes("taobao.com/list/product")) {
      console.log("检测到淘宝搜索页面");
      return true;
    }
    
    // 豆瓣特殊处理
    if (url.includes("douban.com") && 
        (url.includes("search") || url.includes("subject_search"))) {
      console.log("检测到豆瓣搜索页面");
      return true;
    }
  
    const supportedPlatforms = [
      // 各种搜索平台配置
      { name: 'Google', pattern: /google\.com\/(search|imghp|images|videos)/, param: 'q' },
      { name: 'Bing', pattern: /bing\.com\/(search|images|videos|news)/, param: 'q' },
      { name: 'Baidu', pattern: /baidu\.com\/s/, param: 'wd' },
      { name: 'Baidu Images', pattern: /image\.baidu\.com/, param: 'word' },
      { name: 'Baidu Videos', pattern: /video\.baidu\.com/, param: 'word' },
      { name: 'Zhihu', pattern: /zhihu\.com\/search/, param: 'q' },
      { name: 'SMZDM', pattern: /search\.smzdm\.com/, param: 's' },
      { name: 'Xiaohongshu', pattern: /xiaohongshu\.com\/search_result/, param: 'keyword' },
      { name: 'YouTube', pattern: /youtube\.com\/results/, param: 'search_query' },
      { name: 'Bilibili', pattern: /bilibili\.com\/search/, param: 'keyword' },
      { name: 'Bilibili Search', pattern: /search\.bilibili\.com/, param: 'keyword' },
      { name: 'Douyin', pattern: /douyin\.com\/search\//, param: null },
      
      // 淘宝搜索平台
      { name: 'Taobao Search', pattern: /s\.taobao\.com\/search/, param: 'q' },
      { name: 'Taobao Search', pattern: /s\.taobao\.com/, param: null },
      { name: 'Taobao Product', pattern: /taobao\.com\/list\/product/, param: null },
      { name: 'Taobao', pattern: /taobao\.com\/search/, param: 'q' },
      
      // 京东搜索平台
      { name: 'JD Search', pattern: /search\.jd\.com\/Search/, param: 'keyword' },
      { name: 'JD Search', pattern: /search\.jd\.com/, param: null },
      
      // 豆瓣搜索平台
      { name: 'Douban', pattern: /douban\.com\/search/, param: 'q' },
      { name: 'Douban Movie', pattern: /movie\.douban\.com\/subject_search/, param: 'search_text' },
      { name: 'Douban Book', pattern: /book\.douban\.com\/subject_search/, param: 'search_text' },
      { name: 'Douban Music', pattern: /music\.douban\.com\/subject_search/, param: 'search_text' },
      { name: 'Douban Subject', pattern: /www\.douban\.com\/subject_search/, param: 'search_text' },
      { name: 'Douban Movie Search', pattern: /movie\.douban\.com\/search\//, param: null },
      { name: 'Douban Book Search', pattern: /book\.douban\.com\/search\//, param: null },
      { name: 'Douban Music Search', pattern: /music\.douban\.com\/search\//, param: null }
    ];
    
    for (const platform of supportedPlatforms) {
      if (platform.pattern.test(url)) {
        console.log(`匹配成功: [${platform.name}] ${url} 匹配到模式: ${platform.pattern}`);
        return true;
      }
    }
    
    console.log(`未匹配到任何平台: ${url}`);
    return false;
  };
  
  // 监听系统暗色模式变化
  const setupDarkModeListener = () => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const button = document.querySelector('.search-switcher-icon');
      if (button) {
        if (e.matches) {
          // 切换到暗色模式
          button.style.backgroundColor = '#222222';
          button.style.borderColor = '#444444';
        } else {
          // 切换到亮色模式
          button.style.backgroundColor = '#ffffff';
          button.style.borderColor = '#eeeeee';
        }
      }
    });
  };
  
  // 初始化
  const initialize = () => {
    console.log("初始化扩展...");
    
    // 立即检测一次
    const isSearchPage = detectSearchPlatform();
    console.log("是否为搜索页面:", isSearchPage);
    
    if (isSearchPage) {
      console.log("创建悬浮按钮...");
      createFloatingButton();
      setupDarkModeListener();
    } else {
      // 再尝试延迟检测一次，处理某些网站的异步加载
      setTimeout(() => {
        const isSearchPageDelayed = detectSearchPlatform();
        console.log("延迟检测是否为搜索页面:", isSearchPageDelayed);
        
        if (isSearchPageDelayed && !document.getElementById('search-switcher-btn')) {
          console.log("延迟创建悬浮按钮...");
          createFloatingButton();
          setupDarkModeListener();
        }
      }, 2000);
    }
  };
  
  // 设置URL变化监听器
  const setupUrlChangeListener = () => {
    // 监听URL变化，用于SPA
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        initialize();
      }
    }).observe(document, { subtree: true, childList: true });
  };
  
  // 公开接口
  return {
    initialize,
    setupUrlChangeListener
  };
})();

// 当页面加载完成后初始化
window.addEventListener('load', () => {
  ContentScript.initialize();
  ContentScript.setupUrlChangeListener();
}); 