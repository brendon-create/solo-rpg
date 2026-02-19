import { useState, useEffect } from 'react'
import SetupPage from './components/SetupPage'
import Dashboard from './components/Dashboard'
import { initializeSheet, syncToSheet } from './services/googleSheets'

function App() {
  const [showPlayerNameModal, setShowPlayerNameModal] = useState(() => {
    return !localStorage.getItem('solo-rpg-player-name')
  })
  const [inputName, setInputName] = useState('')
  
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('solo-rpg-sheet-url') || ''
  })
  const [isSetup, setIsSetup] = useState(() => {
    return !!localStorage.getItem('solo-rpg-sheet-url')
  })

  const handleSetupComplete = async (url) => {
    try {
      // 初始化 Google Sheet（創建必要的欄位）
      await initializeSheet(url)
      
      localStorage.setItem('solo-rpg-sheet-url', url)
      setSheetUrl(url)
      setIsSetup(true)
    } catch (error) {
      console.error('設置失敗:', error)
      alert('Google Sheet 設置失敗，請檢查 URL 是否正確並確保 Sheet 已設置為「知道連結的任何人都可以編輯」')
    }
  }

  const handleReset = () => {
    if (window.confirm('確定要重置 Google Sheet 連結嗎？這不會刪除您的數據，但需要重新設置。')) {
      localStorage.removeItem('solo-rpg-sheet-url')
      setSheetUrl('')
      setIsSetup(false)
    }
  }

  // 玩家姓名初始化
  if (showPlayerNameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-900 to-gray-900 border-4 border-purple-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4 animate-pulse">⚡</div>
            <p className="text-gray-400 text-sm mb-4">系統檢測到您已成為玩家</p>
            <h3 className="text-2xl font-bold text-purple-300">請輸入角色名稱</h3>
          </div>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inputName.trim()) {
                const name = inputName.trim()
                localStorage.setItem('solo-rpg-player-name', name)
                setShowPlayerNameModal(false)
              }
            }}
            placeholder="輸入您的角色名稱"
            className="w-full px-4 py-3 bg-gray-900 border-2 border-purple-500 rounded-lg text-gray-200 text-center text-xl focus:outline-none focus:border-purple-400 mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              const name = inputName.trim() || 'Player'
              localStorage.setItem('solo-rpg-player-name', name)
              setShowPlayerNameModal(false)
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-200"
          >
            確認
          </button>
        </div>
      </div>
    )
  }

  if (!isSetup) {
    return <SetupPage onSetupComplete={handleSetupComplete} />
  }

  return <Dashboard sheetUrl={sheetUrl} onReset={handleReset} />
}

export default App
