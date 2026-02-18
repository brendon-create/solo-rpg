// ========================================
// Solo RPG Service Worker
// PWA 離線支援 + Cache-first 策略
// ========================================

const CACHE_NAME = 'solo-rpg-v1.0.0';
const STATIC_CACHE = 'solo-rpg-static-v1.0.0';

// 要快取的靜態資源列表
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// ========================================
// 安裝事件 - 快取靜態資源
// ========================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] 安裝中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 [SW] 快取靜態資源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] 安裝完成');
        // 立即啟用，跳過等待
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('❌ [SW] 安裝失敗:', err);
      })
  );
});

// ========================================
// 啟用事件 - 清理舊快取
// ========================================
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] 啟用中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 刪除舊版本快取
            if (cacheName !== STATIC_CACHE && cacheName.startsWith('solo-rpg-')) {
              console.log('🗑️ [SW] 刪除舊快取:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [SW] 啟用完成');
        // 立即取得控制權
        return self.clients.claim();
      })
  );
});

// ========================================
// 請求事件 - Cache-first 策略
// ========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  // 跳過 Chrome 擴充功能和開發工具
  if (url.protocol === 'chrome-extension:' || url.protocol === 'devtools:') {
    return;
  }

  // 網路優先策略：用於 API 請求（需要即時資料）
  if (url.href.includes('script.google.com') || url.href.includes('sheets.googleapis.com')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache-first 策略：用於靜態資源
  event.respondWith(cacheFirstStrategy(request));
});

// ========================================
// Cache-first 策略
// 優點：快速回應、離線可用
// ========================================
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('💾 [SW] 命中快取:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      console.log('🌐 [SW] 網路取得並快取:', request.url);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] 網路請求失敗:', error);
    
    // 回傳離線備用頁面
    return caches.match('/index.html');
  }
}

// ========================================
// Network-first 策略
// 優點：確保資料最新，失敗時回傳快取
// ========================================
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open('solo-rpg-api-v1.0.0');
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ [SW] 網路請求失敗，回傳快取:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果沒有快取，回傳錯誤回應
    return new Response(JSON.stringify({ error: '離線無法取得資料' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ========================================
// 訊息事件 - 處理前端發來的訊息
// ========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📨 [SW] 收到跳過等待指令');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('📜 [SW] Service Worker 已載入');
