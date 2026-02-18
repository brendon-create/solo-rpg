// 版本管理工具
// 用於檢查 App 版本並執行資料遷移

import { FRONTEND_VERSION, REQUIRED_GAS_VERSION } from '../config';

// 前端版本號（從 config.js 導入）
export const CURRENT_APP_VERSION = FRONTEND_VERSION;

// Google Apps Script 最低相容版本
export const REQUIRED_SCRIPT_VERSION = REQUIRED_GAS_VERSION;

/**
 * 檢查並執行資料遷移
 * @param {object} questData - 從 localStorage 或雲端讀取的資料
 * @returns {object} 遷移後的資料
 */
export function migrateData(questData) {
  const localVersion = localStorage.getItem('solo-rpg-app-version') || '1.0.0'
  
  console.log(`📦 資料版本檢查: 本地 ${localVersion} → 目標 ${CURRENT_APP_VERSION}`)
  
  let migratedData = { ...questData }
  
  // 從 1.0.x 升級到 1.1.0
  if (compareVersion(localVersion, '1.1.0') < 0) {
    console.log('🔄 執行 1.0.x → 1.1.0 資料遷移')
    migratedData = migrate_1_0_to_1_1(migratedData)
  }
  
  // 更新版本號
  localStorage.setItem('solo-rpg-app-version', CURRENT_APP_VERSION)
  
  return migratedData
}

/**
 * 1.0.x → 1.1.0 遷移邏輯
 * 新增：alcohol.enabled 欄位
 */
function migrate_1_0_to_1_1(data) {
  const migrated = { ...data }
  
  // 確保 alcohol 物件存在且有 enabled 屬性
  if (migrated.alcohol && migrated.alcohol.enabled === undefined) {
    migrated.alcohol = {
      ...migrated.alcohol,
      enabled: true // 預設啟用
    }
    console.log('✅ 新增 alcohol.enabled 欄位')
  }
  
  // 確保其他可能缺失的欄位也有預設值
  if (!migrated.skl) {
    migrated.skl = {
      enabled: true,
      taskName: '🧹 整理空間 15分鐘',
      completed: false
    }
  }
  
  return migrated
}

/**
 * 比較版本號
 * @returns {number} -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
 */
export function compareVersion(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 < part2) return -1
    if (part1 > part2) return 1
  }
  
  return 0
}

/**
 * 檢查 Apps Script 版本是否過舊
 * @param {string} scriptVersion - 從 API 回傳的版本號
 * @returns {boolean} true 表示需要更新
 */
export function isScriptOutdated(scriptVersion) {
  if (!scriptVersion) return true // 沒有版本號視為過舊
  return compareVersion(scriptVersion, REQUIRED_SCRIPT_VERSION) < 0
}
