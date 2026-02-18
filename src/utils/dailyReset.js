// 每日重置邏輯 - 只重置完成狀態，保留所有自訂設定

/**
 * 智能每日重置
 * @param {object} currentData - 當前的 questData
 * @returns {object} 重置後的 questData
 */
export function smartDailyReset(currentData) {
  console.log('🔄 執行每日智能重置（保留自訂設定）')
  
  // ⚠️ 重要：在重置前，確保昨天的數據已經保存到 historyData
  // 這個邏輯會在 Dashboard 的 useEffect 中處理
  // 這裡只負責重置任務狀態
  
  return {
    ...currentData,
    
    // STR：重置每日任務完成狀態，保留自訂任務名稱和目標
    str: {
      dailyTasks: (currentData.str?.dailyTasks || []).map(task => ({
        ...task,
        completed: false // 只重置完成狀態
      })),
      goals: currentData.str?.goals || {} // 保留目標設定
    },
    
    // HP：重置完成狀態，保留所有設定
    hp: {
      water: 0, // 重置飲水量
      waterRecords: [], // 清空飲水記錄
      waterTarget: currentData.hp?.waterTarget || 2400, // 保留目標
      wakeTime: null, // 重置今日選擇
      sleepTime: null, // 重置今日選擇
      wakeTimeGoals: currentData.hp?.wakeTimeGoals || { 
        best: '05:00', great: '05:30', ok: '06:00', late: '06:00+' 
      }, // 保留設定
      sleepTimeGoals: currentData.hp?.sleepTimeGoals || { 
        best: '21:00', great: '21:30', ok: '22:00', late: '22:00+' 
      }, // 保留設定
      meals: { breakfast: false, lunch: false, dinner: false }, // 重置
      fasting: { breakfastFast: false, dinnerFast: false, fullDayFast: false } // 重置
    },
    
    // INT：重置完成狀態，保留自訂任務
    int: {
      tasks: (currentData.int?.tasks || []).map(task => ({
        ...task,
        completed: false // 只重置完成狀態
      }))
    },
    
    // MP：重置完成狀態，保留自訂任務
    mp: {
      tasks: (currentData.mp?.tasks || []).map(task => ({
        ...task,
        completed: false // 只重置完成狀態
      }))
    },
    
    // CRT：重置完成狀態，保留自訂任務
    crt: {
      tasks: (currentData.crt?.tasks || []).map(task => ({
        ...task,
        completed: false // 只重置完成狀態
      }))
    },
    
    // GOLD：重置完成狀態，保留收入目標
    gold: {
      income: '', // 重置今日收入
      incomeTarget: currentData.gold?.incomeTarget || 3000, // 保留目標
      action1Done: false, // 重置
      action1Text: currentData.gold?.action1Text || '', // 保留文字
      action2Done: false, // 重置
      action2Text: currentData.gold?.action2Text || '', // 保留文字
      action3Done: false, // 重置
      action3Text: currentData.gold?.action3Text || '' // 保留文字
    },
    
    // SKL：重置完成狀態，保留啟用狀態和任務名稱
    skl: {
      enabled: currentData.skl?.enabled !== undefined ? currentData.skl.enabled : true, // 保留開關
      taskName: currentData.skl?.taskName || '🧹 整理空間 15分鐘', // 保留自訂名稱
      completed: false // 重置完成狀態
    },
    
    // RSN：重置
    rsn: { 
      celebrated: false, 
      gratitude: '' 
    },
    
    // 酒精：重置內容，保留啟用狀態
    alcohol: {
      enabled: currentData.alcohol?.enabled !== undefined ? currentData.alcohol.enabled : true, // 保留開關
      reason: '', // 重置
      feeling: '' // 重置
    },
    
    // 保留玩家名稱
    playerName: currentData.playerName,
    
    // 更新時間戳
    lastUpdate: new Date().toISOString()
  }
}

/**
 * 檢查是否需要執行每日重置
 * @param {string} lastUpdate - 上次更新時間的 ISO 字串
 * @returns {boolean} true 表示需要重置
 */
export function shouldResetDaily(lastUpdate) {
  if (!lastUpdate) return false
  
  const lastDate = new Date(lastUpdate)
  const now = new Date()
  const resetTime = new Date()
  resetTime.setHours(4, 0, 0, 0) // 凌晨4點
  
  // 如果上次更新在今天凌晨4點之前，且現在已過凌晨4點，則需要重置
  return lastDate < resetTime && now >= resetTime
}
