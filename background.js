// 背景服务模块（保持持久状态）
const BackgroundService = (() => {
  // tabId -> { targetUrl, lastUrl }
  const tabData = new Map();
  let currentActiveTabId = null;

  // 页面开始导航
  const handleBeforeNavigate = (details) => {
    if (details.frameId === 0) {
      tabData.set(details.tabId, {
        targetUrl: details.url,
        lastUrl: details.url
      });

      if (details.tabId === currentActiveTabId) {
        console.log('[导航开始]', details.url);
      }
    }
  };

  // URL 确定（包括 hash / SPA）
  const handleCommitted = (details) => {
    if (details.frameId === 0 && tabData.has(details.tabId)) {
      const data = tabData.get(details.tabId);
      data.lastUrl = details.url;

      if (details.tabId === currentActiveTabId) {
        console.log('[URL变化]', details.url);
      }
    }
  };

  // 激活标签页
  const handleTabActivated = ({ tabId }) => {
    currentActiveTabId = tabId;
    chrome.tabs.get(tabId, (tab) => {
      const data = tabData.get(tabId) || {};
      const displayUrl = data.targetUrl || tab.url;
      if (displayUrl && !displayUrl.startsWith('chrome://')) {
        console.log('[切换标签页]', displayUrl);
      }
    });
  };

  // 实时监听 URL 更新
  const handleTabUpdated = (tabId, changeInfo) => {
    if (tabId === currentActiveTabId && changeInfo.url) {
      const data = tabData.get(tabId) || {};
      data.lastUrl = changeInfo.url;
      tabData.set(tabId, data);
      console.log('[实时更新]', changeInfo.url);
    }
  };

  // 标签页关闭
  const handleTabRemoved = (tabId) => {
    tabData.delete(tabId);
  };

  // 前端路由（SPA）变化通知
  const handleSpaUrlChange = (msg, sender) => {
    if (msg.url && sender.tab?.id) {
      const data = tabData.get(sender.tab.id) || {};
      data.lastUrl = msg.url;
      tabData.set(sender.tab.id, data);

      if (sender.tab.id === currentActiveTabId) {
        console.log('[前端路由变化]', msg.url);
      }
    }
  };

  // 响应 popup 请求 URL
  const handlePopupRequest = (sendResponse) => {
    const data = tabData.get(currentActiveTabId);
    const url = data?.lastUrl || '';
    console.log('[popup 请求当前 URL]', url);
    sendResponse({ url });
  };

  // 通用消息分发器（单一监听器 ✅ 避免连接错误）
  const handleMessage = (message, sender, sendResponse) => {
    if (message.type === 'url_change') {
      handleSpaUrlChange(message, sender);
      return false; // 非异步
    }

    if (message.type === 'get_current_url') {
      handlePopupRequest(sendResponse);
      return true; // 异步响应
    }

    return false; // 忽略其它类型
  };

  // 初始化服务
  const initialize = () => {
    chrome.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
    chrome.webNavigation.onCommitted.addListener(handleCommitted);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.runtime.onMessage.addListener(handleMessage);

    chrome.runtime.onInstalled.addListener((details) => {
      console.log('扩展已安装或更新', details);
    });

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'popup') {
        console.log('popup 页面已打开');
        port.onDisconnect.addListener(() => {
          console.log('popup 页面已关闭');
        });
      }
    });
  };

  return {
    initialize
  };
})();

BackgroundService.initialize();
