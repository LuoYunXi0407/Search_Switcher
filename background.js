// 后台服务模块
const BackgroundService = (() => {
  // 处理安装或更新事件
  const handleInstalled = (details) => {
    console.log('搜索切换插件已安装或更新', details);
  };

  // 处理消息
  const handleMessage = (message, sender, sendResponse) => {
    if (message.action === 'getSearchInfo') {
      // 返回当前标签页的信息
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ success: false });
          return;
        }
        
        sendResponse({
          success: true,
          url: tabs[0].url
        });
      });
      
      // 返回true表示异步响应
      return true;
    }
  };

  // 处理与popup的连接
  const handleConnect = (port) => {
    if (port.name === 'popup') {
      // 连接开始
      console.log('popup页面已打开');
      
      // 当连接关闭时
      port.onDisconnect.addListener(() => {
        console.log('popup页面已关闭');
        // 这里清理任何相关的状态
      });
    }
  };

  // 初始化后台服务
  const initialize = () => {
    // 监听安装或更新事件
    chrome.runtime.onInstalled.addListener(handleInstalled);
    
    // 监听消息
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // 监听与popup的连接
    chrome.runtime.onConnect.addListener(handleConnect);
  };

  return {
    initialize
  };
})();

// 初始化后台服务
BackgroundService.initialize();

// 添加监听器，在弹出窗口打开前重置状态
chrome.action.onClicked.addListener(() => {
  // 这个事件在点击扩展图标时触发
  // 注意：只有当没有设置popup的时候才会触发
  // 所以我们需要在popup.js中处理状态重置
}); 