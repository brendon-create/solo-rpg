import { useState } from 'react'

export default function OnboardingTutorial({ onComplete }) {
  const [step, setStep] = useState(1)
  const totalSteps = 6

  const copyToClipboard = async () => {
    const code = `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 檢查是否需要初始化表頭
    if (sheet.getLastRow() === 0) {
      initializeSheet(sheet);
    }
    
    // 獲取今天的日期字串
    const todayDateString = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // 檢查今天是否已有記錄
    let todayRowIndex = -1;
    const lastRow = sheet.getLastRow();
    
    for (let i = 2; i <= lastRow; i++) {
      const rowDate = sheet.getRange(i, 1).getValue();
      if (rowDate) {
        const rowDateString = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateString === todayDateString) {
          todayRowIndex = i;
          break;
        }
      }
    }
    
    // INT/MP/CRT tasks
    const intTasks = (data.int?.tasks || []).map(t => \`\${t.name}:\${t.completed}\`).join(';')
    const mpTasks = (data.mp?.tasks || []).map(t => \`\${t.name}:\${t.completed}\`).join(';')
    const crtTasks = (data.crt?.tasks || []).map(t => \`\${t.name}:\${t.completed}\`).join(';')
    
    const row = [
      todayDateString, new Date(),
      data.str?.jogging || false, data.str?.weightTraining || false, data.str?.hiit || false,
      data.str?.goals?.goal1?.name || '', data.str?.goals?.goal1?.unit || '', 
      data.str?.goals?.goal1?.initial || 0, data.str?.goals?.goal1?.target || 0, data.str?.goals?.goal1?.current || 0,
      data.str?.goals?.goal2?.name || '', data.str?.goals?.goal2?.unit || '', 
      data.str?.goals?.goal2?.initial || 0, data.str?.goals?.goal2?.target || 0, data.str?.goals?.goal2?.current || 0,
      data.str?.goals?.goal3?.name || '', data.str?.goals?.goal3?.unit || '', 
      data.str?.goals?.goal3?.initial || 0, data.str?.goals?.goal3?.target || 0, data.str?.goals?.goal3?.current || 0,
      data.hp?.water || 0, data.hp?.waterTarget || 2400,
      data.hp?.wakeTime || '', data.hp?.sleepTime || '',
      data.hp?.meals?.breakfast || false, data.hp?.fasting?.breakfastFast || false,
      data.hp?.meals?.lunch || false,
      data.hp?.meals?.dinner || false, data.hp?.fasting?.dinnerFast || false,
      data.hp?.fasting?.fullDayFast || false,
      intTasks, mpTasks, crtTasks,
      data.gold?.income || '', data.gold?.incomeTarget || 3000,
      data.gold?.action1Done || false, data.gold?.action1Text || '',
      data.gold?.action2Done || false, data.gold?.action2Text || '',
      data.gold?.action3Done || false, data.gold?.action3Text || '',
      data.skl?.enabled || false, data.skl?.taskName || '', data.skl?.completed || false,
      data.rsn?.celebrated || false, data.rsn?.gratitude || '',
      data.alcohol?.reason || '', data.alcohol?.feeling || ''
    ];
    
    if (todayRowIndex > 0) {
      const range = sheet.getRange(todayRowIndex, 1, 1, row.length);
      range.setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheet(sheet) {
  const headers = ['日期','最後更新時間','STR_慢跑','STR_重訓','STR_HIIT','STR_目標1名稱','STR_目標1單位','STR_目標1初始值','STR_目標1目標值','STR_目標1當前值','STR_目標2名稱','STR_目標2單位','STR_目標2初始值','STR_目標2目標值','STR_目標2當前值','STR_目標3名稱','STR_目標3單位','STR_目標3初始值','STR_目標3目標值','STR_目標3當前值','HP_飲水(cc)','HP_飲水目標(cc)','HP_起床時間','HP_就寢時間','HP_早餐自炊','HP_早餐禁食','HP_午餐自炊','HP_晚餐自炊','HP_晚餐禁食','HP_全日禁食','INT_任務列表','MP_任務列表','CRT_任務列表','GOLD_收入','GOLD_收入目標','GOLD_行動1完成','GOLD_行動1內容','GOLD_行動2完成','GOLD_行動2內容','GOLD_行動3完成','GOLD_行動3內容','SKL_啟用','SKL_任務名稱','SKL_完成','RSN_慶祝','RSN_感恩筆記','酒精_理由','酒精_感受'];
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#9333ea');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      return ContentService.createTextOutput(JSON.stringify({success: true, hasData: false, message: 'Sheet is empty'})).setMimeType(ContentService.MimeType.JSON);
    }
    const today = new Date();
    const todayDateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let todayRow = null;
    let totalDays = 0;
    for (let i = 1; i < values.length; i++) {
      totalDays++;
      const rowDate = values[i][0];
      if (rowDate) {
        const rowDateString = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateString === todayDateString) {
          todayRow = values[i];
          break;
        }
      }
    }
    if (!todayRow) {
      return ContentService.createTextOutput(JSON.stringify({success: true, hasData: false, totalDays: totalDays, message: 'No data for today'})).setMimeType(ContentService.MimeType.JSON);
    }
    const parseTasks = (taskString) => {
      if (!taskString) return [];
      return taskString.split(';').map(item => {
        const [name, completed] = item.split(':');
        return { name, completed: completed === 'true' };
      });
    };
    const questData = {
      str: {jogging: todayRow[2] || false, weightTraining: todayRow[3] || false, hiit: todayRow[4] || false, goals: {goal1: {name: todayRow[5] || '', unit: todayRow[6] || '', initial: todayRow[7] || 0, target: todayRow[8] || 0, current: todayRow[9] || 0}, goal2: {name: todayRow[10] || '', unit: todayRow[11] || '', initial: todayRow[12] || 0, target: todayRow[13] || 0, current: todayRow[14] || 0}, goal3: {name: todayRow[15] || '', unit: todayRow[16] || '', initial: todayRow[17] || 0, target: todayRow[18] || 0, current: todayRow[19] || 0}}},
      hp: {water: todayRow[20] || 0, waterTarget: todayRow[21] || 2400, wakeTime: todayRow[22] || null, sleepTime: todayRow[23] || null, waterRecords: [], wakeTimeGoals: { best: '05:00', great: '05:30', ok: '06:00', late: '06:00+' }, sleepTimeGoals: { best: '21:00', great: '21:30', ok: '22:00', late: '22:00+' }, meals: {breakfast: todayRow[24] || false, lunch: todayRow[26] || false, dinner: todayRow[27] || false}, fasting: {breakfastFast: todayRow[25] || false, dinnerFast: todayRow[28] || false, fullDayFast: todayRow[29] || false}},
      int: {tasks: parseTasks(todayRow[30])},
      mp: {tasks: parseTasks(todayRow[31])},
      crt: {tasks: parseTasks(todayRow[32])},
      gold: {income: todayRow[33] || '', incomeTarget: todayRow[34] || 3000, action1Done: todayRow[35] || false, action1Text: todayRow[36] || '', action2Done: todayRow[37] || false, action2Text: todayRow[38] || '', action3Done: todayRow[39] || false, action3Text: todayRow[40] || ''},
      skl: {enabled: todayRow[41] || false, taskName: todayRow[42] || '', completed: todayRow[43] || false},
      rsn: {celebrated: todayRow[44] || false, gratitude: todayRow[45] || ''},
      alcohol: {reason: todayRow[46] || '', feeling: todayRow[47] || ''},
      lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify({success: true, hasData: true, totalDays: totalDays, questData: questData, lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : null})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`

    try {
      await navigator.clipboard.writeText(code)
      alert('✅ 程式碼已複製到剪貼簿！')
    } catch (err) {
      alert('複製失敗，請手動選取複製')
    }
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      localStorage.setItem('solo-leveling-onboarding-complete', 'true')
      onComplete()
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const skipTutorial = () => {
    localStorage.setItem('solo-leveling-onboarding-complete', 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 border-4 border-purple-500 rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        {/* 進度條 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>步驟 {step}/{totalSteps}</span>
            <button onClick={skipTutorial} className="text-gray-500 hover:text-gray-300">跳過教學</button>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* 步驟內容 */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-3xl font-bold text-purple-300 mb-4">歡迎來到 Solo Leveling！</h2>
              <p className="text-lg text-gray-300 mb-6">
                這是一個 RPG 風格的自我成長追蹤系統<br />
                讓我們花幾分鐘設定，開始你的升級之旅！
              </p>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-200">
                  💡 <strong>提示：</strong>為了讓數據同步到雲端（Google Sheet），<br />
                  我們需要先設定 Google Apps Script。<br />
                  別擔心，我們會一步步帶你完成！
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">📋 步驟 1：複製程式碼</h3>
              <p className="text-gray-300 mb-4">
                首先，我們需要複製一段程式碼到 Google Apps Script。
              </p>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-400 mb-2 font-mono">google-apps-script.js</div>
                <div className="bg-gray-800 p-3 rounded text-xs text-gray-400 font-mono overflow-hidden">
                  <div>function doPost(e) &#123;</div>
                  <div className="ml-4">try &#123;</div>
                  <div className="ml-8">const data = JSON.parse(e.postData.contents);</div>
                  <div className="ml-8">...</div>
                  <div className="ml-4">&#125;</div>
                  <div>&#125;</div>
                  <div className="text-gray-600 mt-2">... 完整程式碼共約100行 ...</div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all"
                >
                  📋 複製完整程式碼
                </button>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-200">
                  ✅ 點擊上方按鈕，程式碼會自動複製到剪貼簿
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">📊 步驟 2：開啟 Google Sheet</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-bold mb-1">開啟你的 Google Sheet</p>
                    <p className="text-sm text-gray-400">使用你在第一次設定時輸入的 Google Sheet</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-bold mb-1">點擊「擴充功能」</p>
                    <p className="text-sm text-gray-400">在頂部選單找到「擴充功能」→「Apps Script」</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-bold mb-1">貼上程式碼</p>
                    <p className="text-sm text-gray-400">刪除預設的 function myFunction()，貼上剛才複製的程式碼</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-200">
                  ⚠️ 記得按 Ctrl+S (或 Cmd+S) 儲存程式碼
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">🚀 步驟 3：部署應用程式</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-bold mb-1">點擊「部署」按鈕</p>
                    <p className="text-sm text-gray-400">在 Apps Script 編輯器右上角</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-bold mb-1">選擇「新增部署作業」</p>
                    <p className="text-sm text-gray-400">如果已有部署，選擇「管理部署作業」→「編輯」→「版本：新版本」</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-bold mb-1">選擇類型為「網頁應用程式」</p>
                    <p className="text-sm text-gray-400">點擊齒輪圖示選擇部署類型</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <p className="font-bold mb-1">設定權限</p>
                    <p className="text-sm text-gray-400">
                      執行身分：<span className="text-purple-300">我</span><br />
                      具有存取權的使用者：<span className="text-purple-300">所有人</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">5</div>
                  <div>
                    <p className="font-bold mb-1">點擊「部署」</p>
                    <p className="text-sm text-gray-400">系統會要求授權，點擊「檢視權限」→ 選擇你的Google帳號 → 「前往（不安全）」→「允許」</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">🔗 步驟 4：取得網頁應用程式 URL</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-bold mb-1">複製網頁應用程式 URL</p>
                    <p className="text-sm text-gray-400">部署成功後，會顯示一個 URL，看起來像：</p>
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded text-purple-300 block mt-2">
                      https://script.google.com/macros/s/xxxxx/exec
                    </code>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-bold mb-1">回到這個 App</p>
                    <p className="text-sm text-gray-400">完成教學後，點擊右上角「⚙️ 設定」</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-bold mb-1">貼上 URL 並儲存</p>
                    <p className="text-sm text-gray-400">在「Apps Script Web App URL」欄位貼上，點擊儲存</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-green-200">
                  ✅ 完成後，你的數據就會自動同步到 Google Sheet 了！
                </p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-bold text-purple-300 mb-4">設定完成！</h2>
              <p className="text-lg text-gray-300 mb-6">
                恭喜你完成所有設定！<br />
                現在可以開始你的升級之旅了！
              </p>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-purple-200 mb-2">
                  <strong>💡 快速提示：</strong>
                </p>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>• 點擊標題旁的 ⚙️ 可以自訂各項目標和內容</li>
                  <li>• HP條會實時顯示你的體力水平</li>
                  <li>• 雷達圖左側顯示今日進度，右側顯示累積成長</li>
                  <li>• 每天凌晨04:00會自動重置任務</li>
                  <li>• 所有數據會自動同步到Google Sheet</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3 mt-6">
          {step > 1 && step < totalSteps && (
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              上一步
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
          >
            {step === totalSteps ? '開始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
