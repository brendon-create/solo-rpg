// 時區工具函數
// 確保日期計算使用本地時區（台灣 UTC+8）

/**
 * 取得本地時區的今天的日期字串 (yyyy-MM-dd)
 */
export function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 取得本地時區的今天的 Date 物件
 */
export function getLocalToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * 將 Date 物件轉換為本地時區的日期字串 (yyyy-MM-dd)
 */
export function formatLocalDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 取得昨天的本地日期字串
 */
export function getYesterdayString() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = String(yesterday.getMonth() + 1).padStart(2, '0')
  const day = String(yesterday.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 檢查兩個日期是否為同一天（本地時區）
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  return formatLocalDate(date1) === formatLocalDate(date2)
}
