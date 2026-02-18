// ========================================
// Solo RPG 應用程式配置
// 版本號管理與常數定義
// ========================================

/**
 * 前端版本號
 * 每次發布新版本時請更新此版本號
 */
export const FRONTEND_VERSION = '1.1.0';

/**
 * 最低相容的 Google Apps Script 版本
 * 當 API 回傳的版本號低於此值時，會顯示更新提示
 */
export const REQUIRED_GAS_VERSION = '1.1.0';

/**
 * 應用程式基本資訊
 */
export const APP_INFO = {
  name: 'Solo RPG by BCCT',
  description: '100 天自我升級挑戰追蹤器',
  author: 'BCCT (Base Consciousness Creative Training)',
  website: 'https://sololeveling.bcct-world.com'
};

/**
 * PWA 快取版本
 * 與 sw.js 中的 CACHE_NAME 保持一致
 */
export const CACHE_VERSION = 'solo-rpg-v1.0.0';

/**
 * 同步相關設定
 */
export const SYNC_CONFIG = {
  // 自動同步間隔（毫秒）
  autoSyncInterval: 60000,
  // 同步延遲（毫秒）- 防止頻繁同步
  syncDelay: 5000
};

export default {
  FRONTEND_VERSION,
  REQUIRED_GAS_VERSION,
  APP_INFO,
  CACHE_VERSION,
  SYNC_CONFIG
};
