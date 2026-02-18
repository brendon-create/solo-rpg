import { useState, useEffect } from 'react';

/**
 * PWA 安裝提示 Modal
 * 第一次訪問時教學如何將網站安裝為 App
 */
export default function PWAInstallModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showDeviceGuide, setShowDeviceGuide] = useState(null);
  
  useEffect(() => {
    // 檢查是否已經安裝
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };
    checkInstalled();
    
    // 監聽 PWA 安裝事件
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // 自動偵測設備類型
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setShowDeviceGuide('ios');
    } else if (userAgent.includes('android')) {
      setShowDeviceGuide('android');
    } else {
      setShowDeviceGuide('desktop');
    }
  }, []);
  
  // 處理安裝按鈕點擊
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 border-4 border-purple-500 rounded-xl p-8 max-w-lg w-full shadow-2xl animate-scale-in">
        {/* 標題 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">📱</div>
          <h3 className="text-2xl font-bold text-purple-300 mb-2">
            {isInstalled ? '✅ 已安裝為 App' : showDeviceGuide === 'desktop' ? '將 Solo RPG 安裝到電腦' : '將 Solo RPG 安裝到手機'}
          </h3>
          <p className="text-gray-300">
            {isInstalled 
              ? '您已將 Solo RPG 安裝為獨立 App，可以離線使用！' 
              : '安裝後可像原生 App 一樣使用，支援離線存取'}
          </p>
        </div>
        
        {/* 安裝按鈕（如果瀏覽器支援） */}
        {!isInstalled && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg mb-4"
          >
            📲 一鍵安裝
          </button>
        )}
        
        {/* 設備教學 */}
        {!isInstalled && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-bold text-purple-300 mb-3">
              📋 安裝教學
            </h4>
            
            {/* iOS */}
            {showDeviceGuide === 'ios' && (
              <div className="text-gray-300 text-sm space-y-3">
                <p>請按照以下步驟操作：</p>
                <div className="space-y-2 ml-2">
                  <p><span className="text-purple-400 font-bold">1.</span> 點擊瀏覽器底部的<span className="text-yellow-400 font-bold">「分享」</span>按鈕 📤</p>
                  <p><span className="text-purple-400 font-bold">2.</span> 向下滾動找到<span className="text-yellow-400 font-bold">「添加到主畫面」</span>➕</p>
                  <p><span className="text-purple-400 font-bold">3.</span> 點擊「新增」</p>
                  <p><span className="text-purple-400 font-bold">4.</span> 完成！可以在主畫面找到 Solo RPG 圖示 🎉</p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 mt-3">
                  <p className="text-yellow-300 text-xs">
                    💡 <strong>小提示：</strong>使用 Safari 瀏覽器操作最順暢
                  </p>
                </div>
              </div>
            )}
            
            {/* Android */}
            {showDeviceGuide === 'android' && (
              <div className="text-gray-300 text-sm space-y-3">
                <p>請按照以下步驟操作：</p>
                <div className="space-y-2 ml-2">
                  <p><span className="text-purple-400 font-bold">1.</span> 點擊瀏覽器右上角的<span className="text-yellow-400 font-bold">「選單」</span>⋮</p>
                  <p><span className="text-purple-400 font-bold">2.</span> 選擇<span className="text-yellow-400 font-bold">「安裝應用程式」</span>📲</p>
                  <p><span className="text-purple-400 font-bold">3.</span> 或選擇<span className="text-yellow-400 font-bold">「新增至主畫面」</span>➕</p>
                  <p><span className="text-purple-400 font-bold">4.</span> 點擊「安裝」</p>
                  <p><span className="text-purple-400 font-bold">5.</span> 完成！🎉</p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 mt-3">
                  <p className="text-yellow-300 text-xs">
                    💡 <strong>小提示：</strong>使用 Chrome 瀏覽器操作最順暢
                  </p>
                </div>
              </div>
            )}
            
            {/* Desktop */}
            {showDeviceGuide === 'desktop' && (
              <div className="text-gray-300 text-sm space-y-3">
                <p>電腦版使用方式：</p>
                <div className="space-y-2 ml-2">
                  <p><span className="text-purple-400 font-bold">方法一：</span>Chrome/Edge 瀏覽器在網址列旁邊會顯示 <span className="text-yellow-400 font-bold">「安裝」</span> 圖示，點擊即可</p>
                  <p><span className="text-purple-400 font-bold">方法二：</span>Safari 瀏覽器請點擊上方功能列 <span className="text-yellow-400 font-bold">File → Save to Dock</span></p>
                  <p><span className="text-purple-400 font-bold">方法三：</span>其他瀏覽器可嘗試 <span className="text-yellow-400 font-bold">Ctrl+Shift+I</span> (Windows) 或 <span className="text-yellow-400 font-bold">Cmd+Option+I</span> (Mac) 打開開發者工具</p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 mt-3">
                  <p className="text-yellow-300 text-xs">
                    💡 <strong>小提示：</strong>如果網址列顯示「Open in Web App」，表示已安裝完成，可以像 App 一樣使用！
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-200"
        >
          {isInstalled ? '關閉' : '暫時不要'}
        </button>
        
        {/* 版本號 */}
        <div className="text-center mt-4 text-xs text-gray-500">
          Solo RPG v1.1.0 | PWA Ready 🚀
        </div>
      </div>
    </div>
  );
}
