import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import StatsRadar from './StatsRadar'
import RealTimeHPBar from './RealTimeHPBar'
import STRQuests from './quests/STRQuests'
import HPQuests from './quests/HPQuests'
import CustomizableQuests from './quests/CustomizableQuests'
import GOLDQuests from './quests/GOLDQuests'
import RSNQuests from './quests/RSNQuests'
import SKLQuests from './quests/SKLQuests'
import AlcoholAudit from './AlcoholAudit'
import SettingsModal from './SettingsModal'
import OnboardingTutorial from './OnboardingTutorial'
import ScriptUpdateModal from './ScriptUpdateModal'
import { syncToSheet, fetchFromSheet } from '../services/googleSheets'
import { migrateData, isScriptOutdated, REQUIRED_SCRIPT_VERSION } from '../utils/versionManager'

export default function Dashboard({ sheetUrl, onReset }) {
  const [showSettings, setShowSettings] = useState(false)
  const [showGoalReminder, setShowGoalReminder] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('solo-rpg-onboarding-complete')
  })
  const [showAppScriptReminder, setShowAppScriptReminder] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('solo-rpg-player-name') || 'Player'
  })
  const [showNameConflictModal, setShowNameConflictModal] = useState(false)
  const [conflictNames, setConflictNames] = useState({ local: '', cloud: '' })
  const [showScriptUpdateModal, setShowScriptUpdateModal] = useState(false)
  const [detectedScriptVersion, setDetectedScriptVersion] = useState(null)

  // 先定義所有狀態變量
  const [questData, setQuestData] = useState(() => {
    const saved = localStorage.getItem('solo-rpg-quests')
    if (saved) {
      const data = JSON.parse(saved)
      // 檢查是否需要重置（凌晨 4 點）
      const lastDate = data.lastUpdate
      const now = new Date()
      const resetTime = new Date()
      resetTime.setHours(4, 0, 0, 0)

      if (lastDate && new Date(lastDate) < resetTime && now >= resetTime) {
        return getInitialQuestData()
      }
      return data
    }
    return getInitialQuestData()
  })

  const [totalDays, setTotalDays] = useState(() => {
    const saved = parseInt(localStorage.getItem('solo-rpg-total-days') || '0')
    // 確保至少是第1天
    return saved > 0 ? saved : 1
  })

  // 檢查是否設定了Apps Script URL
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('solo-rpg-onboarding-complete')
    const hasAppScriptUrl = localStorage.getItem('solo-rpg-webapp-url')
    const reminderDismissed = localStorage.getItem('solo-rpg-appscript-reminder-dismissed')

    // 如果完成新手教學但沒有設定URL，且未關閉提醒，顯示提醒
    if (onboardingComplete && !hasAppScriptUrl && !reminderDismissed) {
      setTimeout(() => setShowAppScriptReminder(true), 1000) // 延遲1秒顯示
    }
  }, [])

  // 檢查是否需要顯示反饋提示（第一次 Day 3，之後每 7-10 天隨機跳出）
  useEffect(() => {
    const lastFeedbackDay = parseInt(localStorage.getItem('solo-rpg-last-feedback-day') || '0')
    const nextFeedbackInterval = parseInt(localStorage.getItem('solo-rpg-next-feedback-interval') || '0')

    let shouldShow = false

    // 情況1：從未顯示過，且已到 Day 3
    if (lastFeedbackDay === 0 && totalDays >= 3) {
      shouldShow = true
    }
    // 情況2：已顯示過，且距離上次已超過設定的間隔天數
    else if (lastFeedbackDay > 0 && (totalDays - lastFeedbackDay) >= nextFeedbackInterval) {
      shouldShow = true
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true)
        // 記錄本次顯示的 Day
        localStorage.setItem('solo-rpg-last-feedback-day', totalDays.toString())
        // 隨機生成下次間隔（7-10 天）
        const nextInterval = Math.floor(Math.random() * 4) + 7 // 7, 8, 9, 或 10 天
        localStorage.setItem('solo-rpg-next-feedback-interval', nextInterval.toString())
      }, 10000) // 10秒後彈出

      return () => clearTimeout(timer)
    }
  }, [totalDays])

  // 初始化時確保天數至少為1
  useEffect(() => {
    if (totalDays < 1) {
      setTotalDays(1)
      localStorage.setItem('solo-rpg-total-days', '1')
    }
  }, [])

  // 🔄 多設備同步：從雲端讀取最新數據
  const [isSyncing, setIsSyncing] = useState(false)

  const syncFromCloud = async (showLog = true) => {
    if (isSyncing) {
      console.log('⏳ 同步進行中，跳過')
      return
    }

    try {
      setIsSyncing(true)
      const webAppUrl = localStorage.getItem('solo-rpg-webapp-url')
      if (!webAppUrl) {
        if (showLog) console.log('ℹ️ 未設置 Apps Script URL，跳過雲端同步')
        return
      }

      if (showLog) console.log('🔄 檢查雲端數據...')
      const cloudData = await fetchFromSheet()

      if (!cloudData) {
        if (showLog) console.log('ℹ️ 雲端無數據或讀取失敗')
        return
      }

      // 檢查 Apps Script 版本
      if (cloudData.scriptVersion) {
        setDetectedScriptVersion(cloudData.scriptVersion)
        if (isScriptOutdated(cloudData.scriptVersion)) {
          console.warn(`⚠️ Apps Script 版本過舊: ${cloudData.scriptVersion} (需要 ${REQUIRED_SCRIPT_VERSION})`)
          setShowScriptUpdateModal(true)
        }
      }

      // 比較本地和雲端的時間戳
      const localLastUpdate = questData.lastUpdate ? new Date(questData.lastUpdate).getTime() : 0
      const cloudLastUpdate = cloudData.lastUpdate ? new Date(cloudData.lastUpdate).getTime() : 0

      if (showLog) {
        console.log('📊 本地更新時間:', localLastUpdate ? new Date(localLastUpdate).toLocaleString() : '無數據（初始狀態）')
        console.log('☁️ 雲端更新時間:', cloudLastUpdate ? new Date(cloudLastUpdate).toLocaleString() : '無數據')
      }

      // 如果本地無真實數據（lastUpdate 為 null），或雲端數據較新，使用雲端數據
      if (!questData.lastUpdate || cloudLastUpdate > localLastUpdate) {
        console.log('✅ 雲端數據較新，正在同步到本地...')

        // 執行資料遷移（如果需要）
        const migratedCloudData = migrateData(cloudData.questData)

        // 智能合併：取兩邊較新的數據
        const mergedQuestData = {
          ...migratedCloudData,
          hp: {
            ...cloudData.questData.hp,
            // 直接使用雲端的 waterRecords（因為已包含完整歷史記錄）
            waterRecords: cloudData.questData.hp?.waterRecords || [],
            water: cloudData.questData.hp?.water || 0
          },
          // 確保 STR/INT/MP/CRT tasks 有唯一 id，避免狀態連動
          str: {
            ...cloudData.questData.str,
            dailyTasks: (cloudData.questData.str?.dailyTasks || []).map((task) => ({
              ...task,
              id: task.id || task.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || `str-task-${Math.random().toString(36).substr(2, 9)}`
            }))
          },
          int: {
            tasks: (cloudData.questData.int?.tasks || []).map((task) => ({
              ...task,
              id: task.id || `int-task-${Math.random().toString(36).substr(2, 9)}`
            }))
          },
          mp: {
            tasks: (cloudData.questData.mp?.tasks || []).map((task) => ({
              ...task,
              id: task.id || `mp-task-${Math.random().toString(36).substr(2, 9)}`
            }))
          },
          crt: {
            tasks: (cloudData.questData.crt?.tasks || []).map((task) => ({
              ...task,
              id: task.id || `crt-task-${Math.random().toString(36).substr(2, 9)}`
            }))
          }
        }

        // 檢查玩家姓名衝突
        const localPlayerName = localStorage.getItem('solo-rpg-player-name')
        const cloudPlayerName = cloudData.questData.playerName

        if (localPlayerName && cloudPlayerName && localPlayerName !== cloudPlayerName) {
          // 姓名衝突，讓用戶選擇
          setShowNameConflictModal(true)
          setConflictNames({ local: localPlayerName, cloud: cloudPlayerName })
        }

        setQuestData(mergedQuestData)
        setTotalDays(cloudData.totalDays)

        // 更新 localStorage
        localStorage.setItem('solo-rpg-quests', JSON.stringify(mergedQuestData))
        localStorage.setItem('solo-rpg-total-days', cloudData.totalDays.toString())

        console.log('✅ 已從雲端同步最新數據（已保留本地實時記錄）')
      } else {
        if (showLog) console.log('ℹ️ 本地數據已是最新')
      }
    } catch (error) {
      console.error('❌ 雲端同步失敗:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // 首次載入時同步
  useEffect(() => {
    const timer = setTimeout(() => syncFromCloud(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // 頁面獲得焦點時自動同步（切換回分頁時）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ 頁面獲得焦點，檢查雲端更新...')
        syncFromCloud(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [questData])

  // 定期同步（每 60 秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {  // 只在頁面可見時同步
        console.log('⏰ 定期檢查雲端更新...')
        syncFromCloud(false)
      }
    }, 60000) // 60 秒

    return () => clearInterval(interval)
  }, [questData])

  // 每週提醒更新長期目標（每7天，第一次使用後一週才提醒）
  useEffect(() => {
    const lastReminder = localStorage.getItem('solo-rpg-last-goal-reminder')
    const now = new Date().getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000

    // 第一次使用，記錄時間但不顯示提醒
    if (!lastReminder) {
      localStorage.setItem('solo-rpg-last-goal-reminder', now.toString())
      return
    }

    // 超過7天才顯示提醒
    if ((now - parseInt(lastReminder)) > sevenDays) {
      setShowGoalReminder(true)
      localStorage.setItem('solo-rpg-last-goal-reminder', now.toString())
    }
  }, [totalDays])

  const [historyData, setHistoryData] = useState(() => {
    const saved = localStorage.getItem('solo-rpg-history')
    return saved ? JSON.parse(saved) : []
  })

  // 儲存今日數據到歷史
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayProgress = calculateTodayProgress()

    // 更新歷史記錄
    const newHistory = [...historyData]
    const todayIndex = newHistory.findIndex(h => h.date === today)

    if (todayIndex >= 0) {
      newHistory[todayIndex] = { date: today, data: todayProgress, rsn: questData.rsn }
    } else {
      newHistory.push({ date: today, data: todayProgress, rsn: questData.rsn })
    }

    // 保留所有歷史（不限制天數，因為需要計算累積）
    setHistoryData(newHistory)
    localStorage.setItem('solo-rpg-history', JSON.stringify(newHistory))
  }, [questData])

  const getRSNHistory = () => {
    return historyData
      .filter(h => h.rsn?.celebrated)
      .map(h => ({ date: h.date }))
      .reverse()
  }

  // 計算今天的任務完成度（0-100%）
  const calculateTodayProgress = () => {
    const baseStats = [
      { stat: 'STR', value: calculateSTRToday(), fullMark: 100 },
      { stat: 'INT', value: calculateINTToday(), fullMark: 100 },
      { stat: 'MP', value: calculateMPToday(), fullMark: 100 },
      { stat: 'CRT', value: calculateCRTToday(), fullMark: 100 },
      { stat: 'GOLD', value: calculateGOLDToday(), fullMark: 100 },
    ]

    // 如果SKL啟用，添加到統計中
    if (questData.skl?.enabled) {
      baseStats.push({ stat: 'SKL', value: calculateSKLToday(), fullMark: 100 })
    }

    return baseStats
  }

  const calculateSTRToday = () => {
    // 雷達圖只顯示每日任務完成度 (100%)
    // 長期目標不計入雷達圖，僅在 STR 區塊內單獨顯示
    const dailyTasks = questData.str?.dailyTasks || []
    const completedTasks = dailyTasks.filter(t => t.completed).length
    const totalTasks = dailyTasks.length || 1 // 避免除以0
    const dailyScore = (completedTasks / totalTasks) * 100

    return Math.round(dailyScore)
  }

  const calculateINTToday = () => {
    const tasks = questData.int?.tasks || []
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length || 1 // 避免除以0
    return Math.round((completedCount / totalCount) * 100)
  }

  const calculateMPToday = () => {
    const tasks = questData.mp?.tasks || []
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length || 1
    return Math.round((completedCount / totalCount) * 100)
  }

  const calculateCRTToday = () => {
    const tasks = questData.crt?.tasks || []
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length || 1
    return Math.round((completedCount / totalCount) * 100)
  }

  const calculateGOLDToday = () => {
    const income = parseFloat(questData.gold?.income) || 0
    const incomeTarget = questData.gold?.incomeTarget || 3000
    const actions = [
      questData.gold?.action1Done,
      questData.gold?.action2Done,
      questData.gold?.action3Done
    ].filter(Boolean).length

    // 行動部分：每項16.67%，共50%
    const actionScore = actions * 16.67

    // 收入部分：保守型計分（使用用戶設定的目標）
    let incomeScore = 0
    if (income <= incomeTarget) {
      // 0-目標：線性增長 0% → 50%
      incomeScore = (income / incomeTarget) * 50
    } else {
      // 超過目標：基礎50% + 每多1000元加5%，最高75%
      const excess = income - incomeTarget
      const bonusScore = Math.min((excess / 1000) * 5, 25) // 最多加25%
      incomeScore = 50 + bonusScore
    }

    // 總分上限100%
    const totalScore = Math.min(actionScore + incomeScore, 100)
    return Math.round(totalScore)
  }

  const calculateSKLToday = () => {
    // SKL是單一任務，完成即100%
    return questData.skl?.completed ? 100 : 0
  }

  // 計算累積成長（在100天目標中的進度）
  const calculateCumulativeGrowth = (startDay, endDay, includeTodayLive = false) => {
    let periodData = historyData.slice(startDay - 1, endDay)

    // 如果要包含今天的實時數據（尚未寫入historyData）
    if (includeTodayLive && endDay === totalDays) {
      const today = new Date().toISOString().split('T')[0]
      const todayExists = historyData.some(h => h.date === today)

      if (!todayExists) {
        // 今天的數據還沒在historyData中，手動添加
        periodData = [...periodData, { date: today, data: calculateTodayProgress() }]
      }
    }

    if (periodData.length === 0) return null

    // 計算這段期間每個屬性的總完成度貢獻
    // 每天完成100%的任務 = 貢獻 1% 到整體100天目標
    const totalSTR = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'STR')?.value || 0
      return sum + (dayValue / 100) // 轉換為百分比貢獻
    }, 0)

    const totalINT = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'INT')?.value || 0
      return sum + (dayValue / 100)
    }, 0)

    const totalMP = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'MP')?.value || 0
      return sum + (dayValue / 100)
    }, 0)

    const totalCRT = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'CRT')?.value || 0
      return sum + (dayValue / 100)
    }, 0)

    const totalGOLD = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'GOLD')?.value || 0
      return sum + (dayValue / 100)
    }, 0)

    const totalSKL = periodData.reduce((sum, h) => {
      const dayValue = h.data?.find(d => d.stat === 'SKL')?.value || 0
      return sum + (dayValue / 100)
    }, 0)

    const baseStats = [
      { stat: 'STR', value: parseFloat(totalSTR.toFixed(2)), fullMark: 100 },
      { stat: 'INT', value: parseFloat(totalINT.toFixed(2)), fullMark: 100 },
      { stat: 'MP', value: parseFloat(totalMP.toFixed(2)), fullMark: 100 },
      { stat: 'CRT', value: parseFloat(totalCRT.toFixed(2)), fullMark: 100 },
      { stat: 'GOLD', value: parseFloat(totalGOLD.toFixed(2)), fullMark: 100 },
    ]

    // 如果當前SKL啟用，添加到累積統計中
    if (questData.skl?.enabled) {
      baseStats.push({ stat: 'SKL', value: parseFloat(totalSKL.toFixed(2)), fullMark: 100 })
    }

    return baseStats
  }

  const getCumulativeProgress = () => {
    const lastWeekEnd = Math.floor((totalDays - 1) / 7) * 7
    const thisWeekStart = lastWeekEnd + 1

    // 上週以前的累積
    const lastWeek = lastWeekEnd > 0 ? calculateCumulativeGrowth(1, lastWeekEnd) : null

    // 本週的累積（包含今天的實時數據）
    const thisWeek = totalDays >= thisWeekStart
      ? calculateCumulativeGrowth(1, totalDays, true) // includeTodayLive = true
      : (lastWeek || calculateCumulativeGrowth(1, totalDays, true)) // 第一週

    return {
      lastWeek,
      thisWeek
    }
  }


  // 同步計時器
  const [syncTimer, setSyncTimer] = useState(null)

  // 更新任務數據
  const updateQuest = (category, data) => {
    const newQuestData = {
      ...questData,
      [category]: { ...questData[category], ...data },
      lastUpdate: new Date().toISOString()
    }
    setQuestData(newQuestData)
    localStorage.setItem('solo-rpg-quests', JSON.stringify(newQuestData))

    // 清除舊的計時器
    if (syncTimer) {
      clearTimeout(syncTimer)
    }

    // 設置新的計時器，5秒後同步（防止頻繁同步）
    const newTimer = setTimeout(() => {
      syncToSheet(sheetUrl, {
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        ...newQuestData
      }).catch(err => console.error('同步失敗:', err))
    }, 5000) // 5秒延遲

    setSyncTimer(newTimer)
  }

  // 清理計時器
  useEffect(() => {
    return () => {
      if (syncTimer) {
        clearTimeout(syncTimer)
      }
    }
  }, [syncTimer])

  const todayProgress = calculateTodayProgress()
  const cumulativeProgress = getCumulativeProgress()

  // 計算日期
  const getStartDate = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (totalDays - 1))
    return format(startDate, 'yyyy/MM/dd')
  }

  const getDay100Date = () => {
    const today = new Date()
    const day100Date = new Date(today)
    day100Date.setDate(today.getDate() + (100 - totalDays))
    return format(day100Date, 'yyyy/MM/dd')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 頂部導航 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              ⚔️ Solo RPG by BCCT
            </h1>
            <p className="text-purple-300 text-lg font-semibold mt-1">{playerName} Edition</p>
            <p className="text-gray-400 text-sm">
              Day {totalDays} ({format(new Date(), 'yyyy/MM/dd')}) / Day 100 ({getDay100Date()})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => syncFromCloud(true)}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-lg text-sm border transition-all duration-200 ${isSyncing
                  ? 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed'
                  : 'bg-blue-800 hover:bg-blue-700 text-blue-300 border-blue-700 hover:border-blue-600'
                }`}
              title="手動同步雲端數據"
            >
              {isSyncing ? '⏳ 同步中...' : '🔄 同步'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700"
            >
              ⚙️ 設定
            </button>
          </div>
        </div>

        {/* 姓名衝突警告 */}
        {showNameConflictModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-red-900 to-gray-900 border-4 border-red-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-red-300 mb-2">系統警告</h3>
                <p className="text-gray-300 mb-4">偵測到玩家自我認同衝突</p>
                <p className="text-lg font-semibold text-white mb-2">請選擇你想使用的角色名稱</p>
              </div>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    const selectedName = conflictNames.local
                    setPlayerName(selectedName)
                    localStorage.setItem('solo-rpg-player-name', selectedName)
                    // 更新到 questData 並同步到雲端
                    const newQuestData = {
                      ...questData,
                      playerName: selectedName,
                      lastUpdate: new Date().toISOString()
                    }
                    setQuestData(newQuestData)
                    localStorage.setItem('solo-rpg-quests', JSON.stringify(newQuestData))
                    // 立即同步到雲端
                    syncToSheet(sheetUrl, {
                      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                      ...newQuestData
                    }).catch(err => console.error('同步失敗:', err))
                    setShowNameConflictModal(false)
                  }}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-lg font-semibold"
                >
                  {conflictNames.local}
                </button>
                <button
                  onClick={() => {
                    const selectedName = conflictNames.cloud
                    setPlayerName(selectedName)
                    localStorage.setItem('solo-rpg-player-name', selectedName)
                    // 更新到 questData 並同步到雲端
                    const newQuestData = {
                      ...questData,
                      playerName: selectedName,
                      lastUpdate: new Date().toISOString()
                    }
                    setQuestData(newQuestData)
                    localStorage.setItem('solo-rpg-quests', JSON.stringify(newQuestData))
                    // 立即同步到雲端
                    syncToSheet(sheetUrl, {
                      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                      ...newQuestData
                    }).catch(err => console.error('同步失敗:', err))
                    setShowNameConflictModal(false)
                  }}
                  className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-lg font-semibold"
                >
                  {conflictNames.cloud}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新手教學 */}
        {showOnboarding && (
          <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Apps Script 版本過舊提示 */}
        <ScriptUpdateModal
          isOpen={showScriptUpdateModal}
          onClose={() => setShowScriptUpdateModal(false)}
          currentVersion={detectedScriptVersion}
          requiredVersion={REQUIRED_SCRIPT_VERSION}
        />

        {/* 設定彈窗 */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentSheetUrl={sheetUrl}
          onReset={onReset}
        />

        {/* Apps Script URL 設定提醒 */}
        {showAppScriptReminder && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-900 to-gray-900 border-4 border-blue-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-bold text-blue-300 mb-4">還沒設定同步連結？</h3>
                <div className="text-gray-200 text-left space-y-3 mb-6">
                  <p className="text-sm">如果您剛才部署完 Apps Script 後忘記複製網頁應用程式 URL，可以這樣找回：</p>

                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-bold text-blue-300">📍 如何找回 URL：</p>
                    <ol className="text-xs space-y-2 text-gray-300 ml-4 list-decimal">
                      <li>回到 Google Apps Script 編輯器</li>
                      <li>點擊右上角「部署」→「管理部署作業」</li>
                      <li>在現有部署項目中，複製「網頁應用程式」的 URL</li>
                      <li>點擊本頁面右上角「⚙️ 設定」按鈕</li>
                      <li>貼上 URL 並儲存</li>
                    </ol>
                  </div>

                  <p className="text-xs text-gray-400">
                    💡 設定後，您的數據將自動同步到 Google Sheet
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAppScriptReminder(false)
                      setShowSettings(true)
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                  >
                    前往設定
                  </button>
                  <button
                    onClick={() => {
                      setShowAppScriptReminder(false)
                      localStorage.setItem('solo-rpg-appscript-reminder-dismissed', 'true')
                    }}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                  >
                    稍後再說
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 長期目標提醒 */}
        {showGoalReminder && (() => {
          const goals = questData.str?.goals || {}
          const goalNames = [goals.goal1?.name, goals.goal2?.name, goals.goal3?.name].filter(Boolean).join('、')
          return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-gradient-to-br from-red-900 to-gray-900 border-4 border-red-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">💪</div>
                  <h3 className="text-2xl font-bold text-red-300 mb-4">體能目標追蹤提醒</h3>
                  <p className="text-lg text-gray-200 mb-6">
                    又過了一週！<br />
                    是時候更新你的長期體能目標進度了！<br />
                    {goalNames && (
                      <span className="text-sm text-gray-400 mt-2 block">
                        ({goalNames})
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setShowGoalReminder(false)}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50"
                  >
                    前往更新
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* HP 能量條 - 實時追蹤 */}
        <RealTimeHPBar questData={questData.hp} onUpdate={(data) => updateQuest('hp', data)} />

        {/* 雷達圖 */}
        <div className="mt-6">
          <StatsRadar
            todayProgress={todayProgress}
            cumulativeProgress={cumulativeProgress}
            rsnHistory={getRSNHistory()}
            currentDay={totalDays}
          />
        </div>

        {/* 任務區域 */}
        <div className="mt-8 space-y-4">
          <HPQuests data={questData.hp} onUpdate={(data) => updateQuest('hp', data)} />
          <STRQuests data={questData.str} onUpdate={(data) => updateQuest('str', data)} />

          {/* INT/MP/CRT 自適應橫排 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CustomizableQuests
              title="INT (智力)"
              icon="🧠"
              color="blue"
              data={questData.int}
              onUpdate={(data) => updateQuest('int', data)}
            />
            <CustomizableQuests
              title="MP (魔力)"
              icon="✨"
              color="purple"
              data={questData.mp}
              onUpdate={(data) => updateQuest('mp', data)}
            />
            <CustomizableQuests
              title="CRT (創造力)"
              icon="🎨"
              color="pink"
              data={questData.crt}
              onUpdate={(data) => updateQuest('crt', data)}
            />
          </div>

          <GOLDQuests data={questData.gold} onUpdate={(data) => updateQuest('gold', data)} />
          <SKLQuests data={questData.skl} onUpdate={(data) => updateQuest('skl', data)} />
          <RSNQuests data={questData.rsn} onUpdate={(data) => updateQuest('rsn', data)} />
          <AlcoholAudit data={questData.alcohol} onUpdate={(data) => updateQuest('alcohol', data)} />

          {/* 版權聲明 */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400 leading-relaxed">
              <strong className="text-purple-300">Solo RPG</strong> 由 <strong className="text-purple-300">BCCT</strong> (Base Consciousness Creative Training) 設計，永久免費使用。
              <br />
              如果您喜歡這個 App，歡迎隨時
              <a
                href="mailto:service@brendonchen.com?subject=Solo RPG 使用反饋"
                className="text-blue-400 hover:text-blue-300 underline mx-1"
              >
                提供反饋
              </a>
              與
              <a
                href="https://p.ecpay.com.tw/B723287"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline mx-1"
              >
                自由贊助
              </a>
              ，幫助這個 App 與您一起持續進化。
            </p>
          </div>
        </div>

        {/* 反饋與贊助提示彈窗 */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-purple-900 to-gray-900 border-4 border-purple-500 rounded-xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-purple-300 mb-4">征途回饋：您的聲音很重要</h3>

                <div className="text-gray-200 text-left space-y-4 mb-6">
                  <p className="text-sm">
                    恭喜您已堅持升級 {totalDays} 天！✨
                  </p>
                  <p className="text-sm">
                    您的使用體驗與建議，能幫助我們打造更好的升級工具。
                  </p>

                  <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 space-y-3">
                    <a
                      href="mailto:service@brendonchen.com?subject=Solo RPG 使用反饋"
                      className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-all duration-200 font-medium"
                      onClick={() => setShowFeedbackModal(false)}
                    >
                      📧 分享使用反饋
                    </a>

                    <a
                      href="https://p.ecpay.com.tw/B723287"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-center transition-all duration-200 font-medium"
                      onClick={() => setShowFeedbackModal(false)}
                    >
                      ❤️ 任意額度贊助支持
                    </a>

                    <p className="text-xs text-gray-400 text-center">
                      Solo RPG 完全免費，您的贊助將幫助我們持續改進
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
                >
                  稍後再說
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getInitialQuestData() {
  return {
    str: {
      dailyTasks: [
        { id: 'jogging', name: '🏃 慢跑', completed: false },
        { id: 'weightTraining', name: '🏋️ 重訓', completed: false },
        { id: 'hiit', name: '⚡ HIIT', completed: false }
      ],
      goals: {
        goal1: { name: 'VO2 Max', unit: '', initial: 33, target: 42, current: 33 },
        goal2: { name: '體脂率', unit: '%', initial: 26, target: 18, current: 26 },
        goal3: { name: '5公里跑步', unit: '分鐘', initial: 60, target: 30, current: 60 }
      }
    },
    hp: {
      water: 0,
      waterRecords: [],
      waterTarget: 2400, // 目標飲水量
      wakeTime: null,
      sleepTime: null,
      wakeTimeGoals: { best: '05:00', great: '05:30', ok: '06:00', late: '06:00+' },
      sleepTimeGoals: { best: '21:00', great: '21:30', ok: '22:00', late: '22:00+' },
      meals: { breakfast: false, lunch: false, dinner: false },
      fasting: { breakfastFast: false, dinnerFast: false, fullDayFast: false }
    },
    int: {
      tasks: [
        { id: 'reading', name: '閱讀 15min', completed: false },
        { id: 'italian', name: '義大利文 5min', completed: false },
        { id: 'course', name: '線上課程 15min', completed: false }
      ]
    },
    mp: {
      tasks: [
        { id: 'scripture', name: '讀經', completed: false },
        { id: 'prayer', name: '禱告', completed: false },
        { id: 'journal', name: '靈性日記', completed: false }
      ]
    },
    crt: {
      tasks: [
        { id: 'piano', name: '練琴 10min', completed: false },
        { id: 'drawing', name: '畫畫 10min', completed: false }
      ]
    },
    gold: {
      income: '',
      incomeTarget: 3000,
      action1Done: false,
      action1Text: '',
      action2Done: false,
      action2Text: '',
      action3Done: false,
      action3Text: ''
    },
    skl: {
      enabled: true,
      taskName: '🧹 整理空間 15分鐘',
      completed: false
    },
    rsn: { celebrated: false, gratitude: '' },
    alcohol: { enabled: true, reason: '', feeling: '' },
    playerName: localStorage.getItem('solo-rpg-player-name') || null,
    lastUpdate: null  // 初始數據沒有時間戳，確保雲端數據優先
  }
}
