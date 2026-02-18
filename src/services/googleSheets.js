// Google Sheets 整合服務
// 使用 Google Sheets Web App 作為後端 API

import { REQUIRED_GAS_VERSION } from '../config';
import { compareVersion } from '../utils/versionManager';

/**
 * 從 Google Sheets URL 提取 Sheet ID
 */
export const extractSheetId = (url) => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

/**
 * 檢查 GAS 版本是否過舊
 * @param {string} currentVersion - 從 API 回傳的當前版本號
 * @returns {object} { isOutdated: boolean, message: string }
 */
export const checkGasVersion = (currentVersion) => {
  if (!currentVersion) {
    return {
      isOutdated: true,
      message: '無法取得 GAS 版本號，請更新腳本'
    };
  }
  
  const isOutdated = compareVersion(currentVersion, REQUIRED_GAS_VERSION) < 0;
  
  if (isOutdated) {
    return {
      isOutdated: true,
      message: `GAS 版本過舊 (${currentVersion} < ${REQUIRED_GAS_VERSION})，請更新腳本以確保功能正常`
    };
  }
  
  return {
    isOutdated: false,
    message: 'GAS 版本正常'
  };
};

/**
 * 初始化 Google Sheet（創建表頭）
 */
export const initializeSheet = async (sheetUrl) => {
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    throw new Error('無效的 Google Sheet URL')
  }

  // 檢查 Sheet 是否已經有數據
  // 如果是空的，創建表頭
  const headers = [
    'Date',
    'STR_Exercise_1', 'STR_Exercise_2', 'STR_Exercise_3',
    'STR_VO2Max', 'STR_BodyFat',
    'HP_Water', 'HP_WakeTime', 'HP_SleepTime', 'HP_Meals',
    'INT_Reading', 'INT_Italian', 'INT_Course',
    'MP_Scripture', 'MP_Prayer', 'MP_Journal',
    'CRT_Piano', 'CRT_Drawing',
    'GOLD_Income', 'GOLD_Action1', 'GOLD_Action2', 'GOLD_Action3',
    'RSN_Celebration', 'RSN_Gratitude',
    'ALCOHOL_Reason', 'ALCOHOL_Feeling',
    'Total_Days'
  ]

  // 注意：這需要配合 Google Apps Script 部署的 Web App
  // 用戶需要在說明中看到如何設置
  return { sheetId, headers }
}

/**
 * 同步數據到 Google Sheet
 */
export const syncToSheet = async (sheetUrl, data) => {
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    throw new Error('無效的 Google Sheet URL')
  }

  try {
    // 從 localStorage 讀取用戶設定的 Web App URL
    const webAppUrl = localStorage.getItem('solo-rpg-webapp-url')
    
    if (webAppUrl) {
      // 使用 Apps Script Web App
      console.log('正在同步數據到 Google Sheet...', data)
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors', // 避免 CORS 問題
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      console.log('✅ 數據已發送到 Apps Script')
      return true
    } else {
      // 沒有設置 Web App URL，只在控制台提示
      console.warn('⚠️ 尚未設置 Apps Script Web App URL，數據僅保存在本地')
      console.log('數據內容:', data)
      return false
    }
  } catch (error) {
    console.error('❌ 同步失敗:', error)
    return false
  }
}

/**
 * 從 Google Sheet 讀取數據
 */
export const fetchFromSheet = async () => {
  try {
    // 從 localStorage 讀取用戶設定的 Web App URL
    const webAppUrl = localStorage.getItem('solo-rpg-webapp-url')
    
    if (!webAppUrl) {
      console.warn('⚠️ 尚未設置 Apps Script Web App URL')
      return null
    }

    console.log('🔄 正在從 Google Sheet 讀取數據...')
    
    // 使用 GET 請求讀取數據
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    console.log('📥 收到回應長度:', text.length, '字元')
    
    const result = JSON.parse(text)
    
    if (result.success && result.hasData) {
      console.log('✅ 成功從雲端讀取數據')
      if (result.historyData) {
        console.log('📚 包含歷史數據:', result.historyData.length, '天')
      }
      return {
        questData: result.questData,
        totalDays: result.totalDays,
        lastUpdate: result.lastUpdate,
        historyData: result.historyData || null,
        scriptVersion: result.scriptVersion || null
      }
    } else {
      console.log('ℹ️ 雲端尚無今日數據')
      return null
    }
  } catch (error) {
    console.error('❌ 從雲端讀取數據失敗:', error)
    return null
  }
}
