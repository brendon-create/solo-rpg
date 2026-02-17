import { useState, useEffect } from 'react'

export default function RealTimeHPBar({ questData, onUpdate }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const waterTarget = questData?.waterTarget || 2400
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  // 請求通知權限
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission)
      })
    }
  }, [])

  // 每分鐘更新一次時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 60秒

    return () => clearInterval(timer)
  }, [])

  // 計算飲水HP（50%部分）
  const calculateWaterHP = () => {
    try {
      const now = currentTime
      const hour = now.getHours()

      const waterRecords = questData?.waterRecords || []

      if (waterRecords.length === 0) {
        // 沒有任何飲水記錄，初始狀態為0
        return 0
      }

      // 只在6:00-21:00期間追蹤，非追蹤時段維持滿分
      if (hour < 6 || hour >= 21) {
        return 50
      }

      // 找到最近一次喝水記錄
      const lastRecord = waterRecords[waterRecords.length - 1]
      if (!lastRecord || !lastRecord.time) {
        console.warn('飲水記錄格式錯誤:', lastRecord)
        return 0
      }

      const lastDrinkTime = new Date(lastRecord.time)
      const lastDrinkAmount = Number(lastRecord.amount) || 0

      // 驗證時間是否有效
      if (isNaN(lastDrinkTime.getTime())) {
        console.error('無效的飲水時間:', lastRecord.time)
        return 0
      }

      // 計算距離最後喝水的分鐘數（精確到秒級）
      const secondsSinceLastDrink = Math.floor((now - lastDrinkTime) / 1000)
      const minutesSinceLastDrink = Math.floor(secondsSinceLastDrink / 60)

      // 防止異常的負數或過大值
      if (secondsSinceLastDrink < 0 || minutesSinceLastDrink > 1440) {
        console.warn('異常的時間差:', { secondsSinceLastDrink, minutesSinceLastDrink })
        return 0
      }

      // 如果剛喝完水（最近200cc以上），立即補滿到50%，然後開始遞減
      if (lastDrinkAmount >= 200 && minutesSinceLastDrink < 60) {
        // 剛喝完水的前10秒內，直接返回50%
        if (secondsSinceLastDrink < 10) {
          return 50
        }
        // 從50%開始，在60分鐘內遞減到10%
        const decayRate = 40 / 60 // 每分鐘遞減約0.67%
        const currentHP = 50 - (minutesSinceLastDrink * decayRate)
        return Math.max(Math.floor(currentHP), 10) // 最低10%
      } else if (minutesSinceLastDrink >= 60) {
        // 超過60分鐘沒喝水，降到最低10%（不會變成0或負數）
        return 10
      } else {
        // 喝的量不足200cc，部分補充
        const partialBonus = (lastDrinkAmount / 200) * 20 // 最多補20%
        const baseHP = 30 - (minutesSinceLastDrink * 40 / 60)
        const finalHP = Math.max(baseHP + partialBonus, 10)
        return Math.round(Math.min(Math.max(finalHP, 0), 50)) // 確保在 0-50 範圍內
      }
    } catch (error) {
      console.error('計算飲水HP時發生錯誤:', error)
      return 0 // 發生錯誤時返回安全值
    }
  }

  // 計算生活作息HP（50%部分）
  const calculateLifestyleHP = () => {
    const now = currentTime
    const hour = now.getHours()
    const minute = now.getMinutes()

    // 如果沒有選擇任何起床/就寢時間，返回0
    if (!questData?.wakeTime && !questData?.sleepTime) {
      return 0
    }

    // 基準分數（起床和就寢時間）
    let baseScore = 0

    // 起床時間評分（15分）
    if (questData?.wakeTime === 'best') baseScore += 15
    else if (questData?.wakeTime === 'great') baseScore += 11.25
    else if (questData?.wakeTime === 'ok') baseScore += 7.5
    else if (questData?.wakeTime === 'late') baseScore += 3

    // 就寢時間評分（15分） - 記錄的是前一晚的就寢時間
    if (questData?.sleepTime === 'best') baseScore += 15
    else if (questData?.sleepTime === 'great') baseScore += 11.25
    else if (questData?.sleepTime === 'ok') baseScore += 7.5
    else if (questData?.sleepTime === 'late') baseScore += 3

    // 飲食部分（20分）
    let mealScore = 0
    const meals = questData.meals || {}
    const fasting = questData.fasting || {}

    // 早餐時段（5:00-12:00）
    if (hour >= 5 && hour < 12) {
      if (meals.breakfast || fasting.breakfastFast || fasting.fullDayFast) {
        mealScore += 20 // 維持滿分
      } else {
        // 從5:00開始遞減
        const minutesSince5AM = (hour - 5) * 60 + minute
        const maxDecay = 10 // 最多降10分
        const decayRate = maxDecay / (7 * 60) // 7小時內遞減
        mealScore += Math.max(20 - (minutesSince5AM * decayRate), 10)
      }
    }
    // 午餐時段（12:00-18:00）
    else if (hour >= 12 && hour < 18) {
      if (meals.lunch) {
        mealScore += 20 // 回升到滿分
      } else if (meals.breakfast || fasting.breakfastFast || fasting.fullDayFast) {
        // 從12:00開始遞減
        const minutesSince12PM = (hour - 12) * 60 + minute
        const maxDecay = 10
        const decayRate = maxDecay / (6 * 60)
        mealScore += Math.max(20 - (minutesSince12PM * decayRate), 10)
      } else {
        mealScore += 10 // 早餐也沒吃，維持較低分
      }
    }
    // 晚餐時段（18:00以後）
    else if (hour >= 18) {
      if (meals.dinner || fasting.dinnerFast || fasting.fullDayFast) {
        mealScore += 20 // 維持滿分
      } else if (meals.lunch) {
        // 從18:00開始遞減
        const minutesSince6PM = (hour - 18) * 60 + minute
        const maxDecay = 10
        const decayRate = maxDecay / (5 * 60)
        mealScore += Math.max(20 - (minutesSince6PM * decayRate), 10)
      } else {
        mealScore += 10
      }
    }
    // 凌晨時段（0:00-5:00）
    else {
      if (fasting.fullDayFast || fasting.dinnerFast) {
        mealScore += 20
      } else {
        mealScore += 15 // 給予基礎分
      }
    }

    return Math.round(baseScore + mealScore)
  }

  const waterHP = calculateWaterHP()
  const lifestyleHP = calculateLifestyleHP()
  const totalPercentage = waterHP + lifestyleHP

  // 檢查飲水部分是否需要警告（只看飲水那50%，降到10%以下）
  const needsWaterWarning = waterHP <= 10

  // 上次警告時間（避免重複通知）
  const [lastWarningTime, setLastWarningTime] = useState(null)

  // 發送瀏覽器通知
  useEffect(() => {
    const now = Date.now()
    const lastWarning = lastWarningTime || 0

    // 至少間隔5分鐘才發送下一次通知
    if (needsWaterWarning && notificationPermission === 'granted' && (now - lastWarning) > 5 * 60 * 1000) {
      new Notification('💧 Solo RPG - 該喝水了！', {
        body: `飲水HP已降至 ${waterHP}%（50%中），請立即補充至少200cc水分！`,
        icon: '/vite.svg',
        tag: 'water-warning',
        requireInteraction: true
      })
      setLastWarningTime(now)
    }
  }, [needsWaterWarning, waterHP, notificationPermission, lastWarningTime])

  return (
    <div className={`bg-gray-800 border-2 rounded-xl p-6 ${needsWaterWarning ? 'border-red-500 animate-pulse' : 'border-red-500/50'}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-red-300 flex items-center gap-2">
          ❤️ HP 能量
          {needsWaterWarning && <span className="text-red-400 text-sm animate-bounce">⚠️ 該喝水了！</span>}
        </h2>
        <span className="text-xl font-bold text-red-300">
          {totalPercentage}%
        </span>
      </div>

      {/* 雙色 HP 條 */}
      <div className="relative h-8 bg-gray-900 rounded-full overflow-hidden border-2 border-gray-700">
        {/* 生活作息部分 - 綠色（左側） */}
        <div
          className="absolute left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out flex items-center justify-center"
          style={{ width: `${lifestyleHP}%` }}
        >
          {lifestyleHP > 8 && (
            <span className="text-white text-xs font-bold drop-shadow-lg">
              {lifestyleHP}%
            </span>
          )}
        </div>

        {/* 飲水部分 - 淺藍色（右側） */}
        <div
          className="absolute h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out flex items-center justify-center"
          style={{
            left: `${lifestyleHP}%`,
            width: `${waterHP}%`
          }}
        >
          {waterHP > 8 && (
            <span className="text-white text-xs font-bold drop-shadow-lg">
              {waterHP}%
            </span>
          )}
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded"></div>
          <span className="text-gray-300">🌱 作息 {lifestyleHP}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded"></div>
          <span className="text-gray-300">💧 飲水 {waterHP}%</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        {needsWaterWarning ? '⚠️ 飲水HP過低！請立即補充至少200cc水分' : '作息飲食 50% + 飲水 50% = 總體體力水平'}
      </p>

      {/* 調試信息（可選） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>飲水記錄數: {questData?.waterRecords?.length || 0}</div>
          <div>最後喝水: {questData?.waterRecords?.length > 0 ? new Date(questData.waterRecords[questData.waterRecords.length - 1].time).toLocaleTimeString() : '無'}</div>
        </div>
      )}
    </div>
  )
}
