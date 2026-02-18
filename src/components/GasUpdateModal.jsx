import { useState } from 'react';

/**
 * Google Apps Script 更新提示 Modal
 * 當檢測到 GAS 版本過舊時顯示此提示
 */
export default function GasUpdateModal({ 
  isOpen, 
  onClose, 
  currentGasVersion, 
  requiredGasVersion,
  onUpdateScript 
}) {
  const [showTutorial, setShowTutorial] = useState(false);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-red-900 to-gray-900 border-4 border-red-500 rounded-xl p-8 max-w-lg w-full shadow-2xl animate-scale-in">
        {/* 標題 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-red-300 mb-2">
            後端系統已升級
          </h3>
          <p className="text-gray-300">
            檢測到您的 Google Apps Script 版本過舊
          </p>
        </div>

        {/* 版本資訊 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">目前版本：</span>
            <span className="text-red-400 font-mono">{currentGasVersion || '未知'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">需要版本：</span>
            <span className="text-green-400 font-mono">{requiredGasVersion}</span>
          </div>
        </div>

        {/* 說明文字 */}
        <div className="text-gray-200 text-left space-y-3 mb-6">
          <p className="text-sm">
            您的 Google Apps Script 腳本版本過舊，可能導致以下問題：
          </p>
          <ul className="text-sm text-gray-300 space-y-1 ml-4 list-disc">
            <li>資料無法正確同步到 Google Sheets</li>
            <li>部分新功能無法使用</li>
            <li>可能出現資料遺失的風險</li>
          </ul>
          <p className="text-sm mt-3">
            請點擊下方按鈕重新授權或更新 Google Apps Script 腳本，以確保功能正常執行。
          </p>
        </div>

        {/* 更新步驟（可展開的教學區塊） */}
        {showTutorial && (
          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-bold text-purple-300 mb-3">
              📋 GAS 更新步驟教學
            </h4>
            
            <div className="text-gray-300 text-sm space-y-3">
              <p>請按照以下步驟更新 Google Apps Script：</p>
              
              <div className="space-y-2 ml-2">
                <p><span className="text-purple-400 font-bold">1.</span> 開啟 Google Apps Script 編輯器</p>
                <p className="text-gray-400 text-xs ml-4">網址：<a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">script.google.com</a></p>
                
                <p><span className="text-purple-400 font-bold">2.</span> 開啟專案後，點擊左側「專案設定」齒輪圖示</p>
                
                <p><span className="text-purple-400 font-bold">3.</span> 查看目前版本號是否為 <span className="text-green-400 font-mono">{requiredGasVersion}</span></p>
                
                <p><span className="text-purple-400 font-bold">4.</span> 如果需要更新，點擊左側「部署」>「新增部署」</p>
                
                <p><span className="text-purple-400 font-bold">5.</span> 選擇類型為「網頁應用程式」</p>
                
                <p><span className="text-purple-400 font-bold">6.</span> 設定：</p>
                <ul className="text-gray-400 text-xs ml-8 list-disc space-y-1">
                  <li>執行人員：ME（自己）</li>
                  <li>誰有權限：任何人</li>
                </ul>
                
                <p><span className="text-purple-400 font-bold">7.</span> 點擊「部署」，複製新的 Web App URL</p>
                
                <p><span className="text-purple-400 font-bold">8.</span> 回到 Solo RPG 設定頁面，更新 Web App URL</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 mt-3">
                <p className="text-yellow-300 text-xs">
                  💡 <strong>小提示：</strong>如果你的 GAS 代碼沒變化，只是版本號更新，只需要確認部署版本號增加即可，不需要重新複製 URL。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 按鈕區域 */}
        <div className="space-y-3">
          {/* 主要操作按鈕 */}
          <button
            onClick={onUpdateScript || (() => {
              // 開啟設定頁面或 GAS 編輯器
              window.open('https://script.google.com', '_blank');
            })}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50"
          >
            🔄 前往更新 Google Apps Script
          </button>
          
          {/* 顯示/隱藏教學 */}
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all text-sm"
          >
            {showTutorial ? '👆 隱藏教學' : '📖 顯示更新教學'}
          </button>
          
          {/* 關閉按鈕（延遲提醒） */}
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all text-sm border border-gray-600"
          >
            稍後再說（可能影響資料同步）
          </button>
        </div>
        
        {/* 版本號顯示 */}
        <div className="text-center mt-4 text-xs text-gray-500">
          Solo RPG v1.0.0 | GAS 相容版本: {requiredGasVersion}
        </div>
      </div>
    </div>
  );
}
