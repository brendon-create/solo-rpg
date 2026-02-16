import { useState } from 'react'

// Solo Leveling 風格的通知組件
function LevelingNotification({ message, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 border-4 border-purple-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <h3 className="text-2xl font-bold text-purple-300 mb-4">系統通知</h3>
          <p className="text-lg text-gray-200 mb-6">{message}</p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsModal({ isOpen, onClose, currentSheetUrl, onReset }) {
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return localStorage.getItem('solo-leveling-webapp-url') || ''
  })
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const showLevelingNotification = (message) => {
    setNotificationMessage(message)
    setShowNotification(true)
  }

  const handleSave = () => {
    if (webAppUrl) {
      localStorage.setItem('solo-leveling-webapp-url', webAppUrl)
      showLevelingNotification('🎮 遊戲初始化成功！數據同步已啟動，頁面即將重新載入以同步雲端數據...')
    } else {
      onClose()
    }
  }

  const handleClear = () => {
    localStorage.removeItem('solo-leveling-webapp-url')
    setWebAppUrl('')
    showLevelingNotification('⚠️ 同步連結已移除，數據將僅保存在本地。')
  }

  const handleNotificationClose = () => {
    setShowNotification(false)
    onClose()
    // 如果剛剛儲存了 URL，重新載入頁面以觸發雲端同步
    if (notificationMessage.includes('遊戲初始化成功')) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {showNotification && (
        <LevelingNotification
          message={notificationMessage}
          onClose={handleNotificationClose}
        />
      )}
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">⚙️ 設定</h2>

          {/* Google Sheet URL */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">📊 Google Sheet</h3>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">當前連接的 Sheet：</p>
              <p className="text-xs text-gray-300 break-all font-mono">{currentSheetUrl}</p>
              <button
                onClick={onReset}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                重新連接其他 Sheet
              </button>
            </div>
          </div>

          {/* Apps Script Web App URL */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">🔗 Apps Script Web App URL（選填）</h3>
            <p className="text-sm text-gray-400 mb-3">
              如果您已經部署了 Google Apps Script Web App，請在此輸入 URL 以啟用自動同步功能。
            </p>
            <input
              type="text"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/xxxxx/exec"
              className="w-full px-4 py-3 bg-gray-900 border-2 border-purple-500/50 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors font-mono"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                儲存
              </button>
              {webAppUrl && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 說明 */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm mb-2">
              📖 <strong>如何取得 Web App URL？</strong>
            </p>
            <ol className="text-blue-200 text-xs space-y-1 ml-4">
              <li>1. 在 Google Sheet 中開啟 Apps Script（擴充功能 → Apps Script）</li>
              <li>2. 貼上 Apps Script 代碼（參考 GOOGLE_SHEETS_SETUP.md）</li>
              <li>3. 點擊「部署」→「新增部署作業」</li>
              <li>4. 選擇「網頁應用程式」，執行身分選「我」，存取權選「所有人」</li>
              <li>5. 複製 Web App URL 並貼到上方</li>
            </ol>
          </div>

          {/* 關閉按鈕 */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
