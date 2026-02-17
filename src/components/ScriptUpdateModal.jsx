import { useState } from 'react'
import appsScriptCode from '../../google-apps-script.js?raw'

export default function ScriptUpdateModal({ isOpen, onClose, currentVersion, requiredVersion }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('複製失敗:', err)
      alert('複製失敗，請手動選取並複製')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-orange-900 to-gray-900 border-4 border-orange-500 rounded-xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-orange-300 mb-2">Apps Script 版本過舊</h3>
          <p className="text-gray-300 mb-2">
            目前版本：<span className="text-red-400 font-mono">{currentVersion || '未知'}</span> → 
            需要版本：<span className="text-green-400 font-mono">{requiredVersion}</span>
          </p>
          <p className="text-sm text-gray-400">
            為確保功能正常運作，請更新您的 Google Apps Script
          </p>
        </div>

        <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-bold text-orange-300 mb-4">📋 更新步驟（3分鐘完成）</h4>
          
          <div className="space-y-4 text-sm text-gray-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-200 mb-1">複製最新程式碼</p>
                <button
                  onClick={copyToClipboard}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {copied ? '✅ 已複製！' : '📋 點擊複製程式碼'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-200 mb-1">開啟 Google Apps Script</p>
                <p className="text-xs text-gray-400">
                  在您的 Google Sheet 中點擊「擴充功能」→「Apps Script」
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-200 mb-1">替換程式碼</p>
                <p className="text-xs text-gray-400">
                  刪除編輯器中的所有舊程式碼，貼上剛才複製的新程式碼，然後點擊「儲存」（Ctrl+S）
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                4
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-200 mb-1">重新部署</p>
                <p className="text-xs text-gray-400 mb-2">
                  點擊右上角「部署」→「管理部署作業」→ 點擊「編輯」（鉛筆圖示）
                </p>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                  <p className="text-xs text-blue-300">
                    ⚠️ 重要：版本選擇「<strong>新版本</strong>」，不要建立新部署！<br />
                    這樣您的 URL 才不會改變
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                5
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-200 mb-1">完成！</p>
                <p className="text-xs text-gray-400">
                  點擊「部署」後，重新整理本頁面即可
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-300 text-xs">
            💡 <strong>為什麼需要更新？</strong><br />
            我們新增了酒精記錄開關功能，需要在 Google Sheet 中新增一個欄位。
            更新後您的所有資料都會保留，不會遺失任何記錄。
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            稍後再說
          </button>
          <button
            onClick={() => {
              copyToClipboard()
              window.open('https://script.google.com', '_blank')
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200"
          >
            🚀 複製並前往更新
          </button>
        </div>
      </div>
    </div>
  )
}
